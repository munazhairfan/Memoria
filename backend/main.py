# backend/main.py

# CRITICAL: This must be the absolute first import to enforce matching paths across all execution threads!
from config import init_config
init_config()
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import uvicorn
import cognee
import os
from cognee_client import remember, recall
import json as _json
from pathlib import Path as _Path
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: silently build graph from existing memories if no graph file yet
    if not GRAPH_FILE.exists():
        try:
            topics = ["diary entry", "activity", "project", "people", "places", "feelings"]
            all_memories = []
            for topic in topics:
                try:
                    results = await recall(topic)
                    all_memories.extend(results)
                except Exception:
                    pass
            seen = set()
            unique = [m for m in all_memories if not (m in seen or seen.add(m))]
            if unique:
                await _extract_and_store_triples("backfill", unique)
        except Exception as e:
            print(f"--> [Startup backfill error]: {e}")
    yield  # App runs here

app = FastAPI(
    title="Memoria API",
    description="Conversational diary backend powered by Cognee graph memory.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────

class EntryRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    query: str

# Helper function

GRAPH_FILE = _Path(__file__).parent / "memory_graph.json"

def _load_graph() -> dict:
    if GRAPH_FILE.exists():
        try:
            return _json.loads(GRAPH_FILE.read_text())
        except Exception:
            pass
    return {"nodes": {}, "edges": []}  # nodes = {label: id}

def _save_graph(g: dict):
    GRAPH_FILE.write_text(_json.dumps(g))

async def _extract_and_store_triples(text: str, memories: list[str]):
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=os.environ["LLM_API_KEY"])

        context = "\n".join(memories) if memories else text
        prompt = f"""Extract knowledge graph triples from the following diary memory.
CRITICAL: Ensure temporal data (dates, time frames mentioned, or the date of the entry) is explicitly captured. Link events, projects, and feelings to their respective dates or periods.
Return ONLY a JSON array of objects with keys: subject, relationship, object.
No explanation, no markdown, just the raw JSON array.

Memory:
{context}"""

        r = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = r.choices[0].message.content.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        triples = _json.loads(raw.strip())

        g = _load_graph()
        for t in triples:
            subj = str(t.get("subject", "")).strip()
            rel  = str(t.get("relationship", "")).strip()
            obj  = str(t.get("object", "")).strip()
            if not subj or not rel or not obj:
                continue
            # Add nodes (deduplicated by label)
            if subj not in g["nodes"]:
                g["nodes"][subj] = str(len(g["nodes"]))
            if obj not in g["nodes"]:
                g["nodes"][obj] = str(len(g["nodes"]))
            # Add edge
            g["edges"].append({
                "source": g["nodes"][subj],
                "target": g["nodes"][obj],
                "label": rel,
                "subj": subj,
                "obj": obj
            })
        _save_graph(g)
    except Exception as e:
        print(f"--> [Graph extraction error]: {e}")
# ── Routes ─────────────────────────────────────────────────────────────────

@app.post("/entry")
async def create_entry(body: EntryRequest):
    """
    Save a diary entry into Cognee's graph memory.
    This also builds the LanceDB vector schema if it doesn't exist yet.
    """
    try:
        if not body.text.strip():
            raise HTTPException(status_code=400, detail="Entry text must not be empty.")

        current_date = datetime.now().strftime("%B %d, %Y")
        # Structure the text with a clear time anchor
        time_anchored_text = f"On {current_date}: {body.text}"

        await remember(time_anchored_text)

        # Extract real triples from this entry and store in graph
        try:
            memories = await recall(body.text)
            memories = list(dict.fromkeys(memories))
            await _extract_and_store_triples(time_anchored_text, memories)
        except Exception:
            pass  # Don't fail the entry if graph extraction fails

        return {"status": "saved"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})


@app.post("/query")
async def query_memory(body: QueryRequest):
    """
    Query Cognee's graph memory for relevant diary entries.
    Returns an empty list if no entries have been saved yet,
    rather than crashing on a missing vector table.
    """
    try:
        if not body.query.strip():
            raise HTTPException(status_code=400, detail="Query must not be empty.")

        results = await recall(body.query)
        return {"answer": results}
    except HTTPException:
        raise
    except Exception as e:
        err = str(e).lower()
        if "textsummary" in err or "does not exist" in err or "no such table" in err:
            return {"answer": []}
        raise HTTPException(status_code=500, detail={"error": str(e)})


@app.get("/graph")
async def get_graph():
    try:
        g = _load_graph()
        nodes = [{"id": nid, "label": label} for label, nid in g["nodes"].items()]
        edges = [{"source": e["source"], "target": e["target"], "label": e["label"]} for e in g["edges"]]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"--> [Graph error]: {e}")
        return {"nodes": [], "edges": []}
    
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "remember_entry",
            "description": "Save something the user shared about their life, feelings, events, or anything diary-like.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "The diary entry text to remember"}
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recall_memory",
            "description": "Search the user's past memories to answer a question about their history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query to find relevant memories"}
                },
                "required": ["query"]
            }
        }
    }
]


SYSTEM_PROMPT = """You are Memoria, a warm and thoughtful AI diary companion. You help users reflect on their life by remembering what they share and recalling memories when asked. You speak like a caring friend, not an assistant. Keep responses concise — 2-3 sentences max.

Only use the remember_entry tool when the user shares something meaningful about their life — feelings, events, experiences, achievements, preferences, or personal updates. Do NOT use remember_entry for casual questions, greetings, small talk, or anything that is not a personal diary-worthy thought.

Only use recall_memory when the user is explicitly asking about something from their past.

For everything else, just respond conversationally without using any tool."""


@app.post("/chat")
async def chat(body: ChatRequest):
    try:
        import json
        import re
        from groq import AsyncGroq

        client = AsyncGroq(api_key=os.environ.get("LLM_API_KEY"))

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in body.history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": body.message})

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )

        choice = response.choices[0]

        # Standard clean execution path
        if choice.message.tool_calls:
            tool_call = choice.message.tool_calls[0]
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)
            tool_id = tool_call.id
        else:
            # --- ROBUST LLM STRING-FALLBACK PARSING LAYER ---
            # If Groq emits a 400 because it hallucinates tags directly into text content:
            content_str = choice.message.content or ""
            
            if "recall_memory" in content_str:
                fn_name = "recall_memory"
                tool_id = "fallback_id_recall"
                # Match everything inside the arguments block dynamically
                query_match = re.search(r'"query":\s*"([^"\\]*(?:\\.[^"\\]*)*)"', content_str)
                fn_args = {"query": query_match.group(1) if query_match else body.message}
            elif "remember_entry" in content_str:
                fn_name = "remember_entry"
                tool_id = "fallback_id_remember"
                text_match = re.search(r'"text":\s*"([^"\\]*(?:\\.[^"\\]*)*)"', content_str)
                fn_args = {"text": text_match.group(1) if text_match else body.message}
            else:
                # No regular text formatting anomalies; treat as plain chat
                return {"reply": content_str, "action": "chat"}

        # Build a safe helper dictionary context for Groq's conversational history array
        assistant_msg = {
            "role": "assistant",
            "content": choice.message.content if choice.message.content else None,
            "tool_calls": [
                {
                    "id": tool_id,
                    "type": "function",
                    "function": {
                        "name": fn_name,
                        "arguments": json.dumps(fn_args)
                    }
                }
            ] if tool_id != "fallback_id" else None
        }

        # Step 3a: remember_entry pipeline route
        if fn_name == "remember_entry":
            text = fn_args["text"]
            current_date = datetime.now().strftime("%B %d, %Y")
            time_anchored_text = f"On {current_date}: {text}"
            
            # Save the time-anchored memory to Cognee
            await remember(time_anchored_text)

            try:
                memories = await recall(text)
                memories = list(dict.fromkeys(memories))
                await _extract_and_store_triples(time_anchored_text, memories, source_memory=time_anchored_text)
            except Exception:
                pass  # don't fail the chat reply if graph extraction fails

            follow_up = messages + [
                assistant_msg,
                {
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "name": fn_name,
                    "content": f"Memory saved successfully: '{time_anchored_text}'"
                },
                {
                    "role": "user",
                    "content": "Answer my question conversationally using those memories. If a memory includes a date prefix like 'On [date]:', state that date explicitly in your answer."
                }
            ]
            r2 = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=follow_up,
            )
            return {"reply": r2.choices[0].message.content, "action": "remember"}

        # Step 3b: recall_memory pipeline route
        if fn_name == "recall_memory":
            query = fn_args["query"]
            results = await recall(query)
            context = "\n".join(results) if results else "No memories found for that topic."

            follow_up = messages + [
                assistant_msg,
                {
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "name": fn_name,
                    "content": context
                },
                {
                    "role": "user",
                    "content": "Answer my question conversationally using those memories."
                }
            ]
            r2 = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=follow_up,
            )
            return {"reply": r2.choices[0].message.content, "action": "recall"}

        return {"reply": choice.message.content or "I'm not sure how to respond to that.", "action": "chat"}

    except Exception as e:
        # Final catch-all structural extractor if the SDK errors out on tool parameters early
        err_msg = str(e)
        if "recall_memory" in err_msg:
            try:
                import re
                # Dynamically extract whatever query the LLM actually tried to pass
                query_match = re.search(r'"query":\s*"([^"]+)"', err_msg)
                fallback_query = query_match.group(1) if query_match else body.message
                
                # Execute a clean database lookup using the actual query
                results = await recall(fallback_query)
                
                if results:
                    context = "\n".join(results)
                    # Let a fast fallback completion provide the answer using the real context
                    r2 = await client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": f"Context memories found:\n{context}\n\nAnswer the user's question: {body.message}"}
                        ]
                    )
                    return {"reply": r2.choices[0].message.content, "action": "recall"}
                else:
                    return {
                        "reply": f"I checked my notes for '{fallback_query}', but I don't have the specific details about that project written down yet. Could you remind me what it's called?",
                        "action": "recall"
                    }
            except Exception:
                pass
        
        raise HTTPException(status_code=500, detail={"error": str(e)})

@app.get("/history")
async def get_history():
    try:
        results = await recall("User long-term memory profile, permanent facts, core timeline, life events, and chronological summary.")
        
        cleaned_results = []
        if results and isinstance(results, list):
            for item in results:
                # If Cognee leaks its internal Python class string representation
                if isinstance(item, str) and "kind='graph_completion'" in item:
                    try:
                        # Extract what is inside text="..."
                        if 'text="' in item:
                            # Split at text=" and grab everything before the next attribute quote
                            text_part = item.split('text="')[1].split('" score=')[0]
                            # Unescape internal quotes if any exist
                            text_part = text_part.replace('\\"', '"')
                            cleaned_results.append(text_part)
                        else:
                            cleaned_results.append(item)
                    except Exception:
                        cleaned_results.append(item) # Fallback to raw item if split fails
                else:
                    cleaned_results.append(item)
        else:
            cleaned_results = results

        from fastapi.responses import JSONResponse
        return JSONResponse(
            content={"history": cleaned_results},
            headers={"Cache-Control": "no-store, no-cache", "Pragma": "no-cache"}
        )
    except Exception as e:
        err = str(e).lower()
        if "textsummary" in err or "does not exist" in err or "no such table" in err:
            return {"history": []}
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ── Entrypoint ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)