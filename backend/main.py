# CRITICAL: This must be the absolute first import to enforce matching paths across all execution threads!
# uvicorn backend.main:app --reload
from backend.config import init_config
init_config()
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import uvicorn
import cognee
import os
from backend.cognee_client import remember, recall
import json as _json
from pathlib import Path as _Path
from contextlib import asynccontextmanager
from backend.routers.conversations import router as conversations_router
from backend.routers.auth import router as auth_router
from bson import ObjectId
from datetime import datetime, timezone
from backend.database import conversations, messages, users   # Make sure this line exists
from backend.models import ChatRequest
from backend.auth import get_current_user_id

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: silently build each registered user's graph from their existing
    # memories if they don't have one yet. recall() is now scoped to each
    # user's own Cognee dataset (see cognee_client.py), so this backfill only
    # ever pulls that user's own memories.
    try:
        async for user in users.find({}):
            uid = str(user["_id"])
            if _graph_file(uid).exists():
                continue
            try:
                topics = ["diary entry", "activity", "project", "people", "places", "feelings"]
                all_memories = []
                for topic in topics:
                    try:
                        results = await recall(topic, uid)
                        all_memories.extend(results)
                    except Exception:
                        pass
                seen = set()
                unique = [m for m in all_memories if not (m in seen or seen.add(m))]
                if unique:
                    await _extract_and_store_triples(uid, "backfill", unique)
            except Exception as e:
                print(f"--> [Startup backfill error for user {uid}]: {e}")
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

app.include_router(conversations_router)
app.include_router(auth_router)

# ── Schemas ────────────────────────────────────────────────────────────────

class EntryRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    query: str

# Helper function

GRAPH_DIR = _Path(__file__).parent / "graphs"
GRAPH_DIR.mkdir(exist_ok=True)

# FIX: this used to be one hardcoded GRAPH_FILE shared by every user — every
# user's extracted people/places/events were mixed into a single file that
# anyone with a valid token could read via /graph. Now scoped per user_id.
def _graph_file(user_id: str) -> _Path:
    safe_id = "".join(c for c in user_id if c.isalnum() or c in "-_")
    return GRAPH_DIR / f"memory_graph_{safe_id}.json"

def _load_graph(user_id: str) -> dict:
    path = _graph_file(user_id)
    if path.exists():
        try:
            return _json.loads(path.read_text())
        except Exception:
            pass
    return {"nodes": {}, "edges": []}  # nodes = {label: id}

def _save_graph(user_id: str, g: dict):
    _graph_file(user_id).write_text(_json.dumps(g))

def _search_graph_triples(user_id: str, query: str) -> list[str]:
    # FIX: recall_memory (used by /chat) previously only ever queried
    # Cognee's live semantic chunk search, which can miss short factual
    # details (dates, names) that chunk-similarity ranking doesn't surface
    # well — even when that exact fact is sitting in the graph the user can
    # see on /memories. Triple extraction already has a fallback to raw
    # entry text (see _extract_and_store_triples below), which is why the
    # graph reliably has facts that live chat recall sometimes misses. This
    # gives chat recall the same safety net: a plain keyword match over the
    # user's own stored (subject, relationship, object) triples.
    g = _load_graph(user_id)
    STOPWORDS = {"user", "the", "and", "was", "that", "this", "did", "does",
                 "have", "has", "with", "for", "about", "know", "when", "what"}
    terms = [t.lower() for t in query.split() if len(t) > 2 and t.lower() not in STOPWORDS]
    if not terms:
        return []
    hits = []
    for e in g.get("edges", []):
        subj, rel, obj = e.get("subj", ""), e.get("label", ""), e.get("obj", "")
        haystack = f"{subj} {rel} {obj}".lower()
        if any(term in haystack for term in terms):
            hits.append(f"{subj} {rel} {obj}")
    return hits

async def _extract_and_store_triples(user_id: str, text: str, memories: list[str], source_memory: str = None):
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=os.environ["LLM_API_KEY"])

        context = "\n".join(memories) if memories else text
        prompt = f"""Extract knowledge graph triples from the diary entry below.

CRITICAL RULES:
- ALWAYS capture temporal information: dates, times, "on [date]", "last week", "in June", etc.
- Create explicit triples linking events to their dates.
- Use relationship names like: "happened_on", "occurred_on", "scheduled_for", "took_place_in", "mentioned_date".

Return ONLY a valid JSON array of objects. No explanation, no markdown.

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

        g = _load_graph(user_id)
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
        _save_graph(user_id, g)
    except Exception as e:
        print(f"--> [Graph extraction error]: {e}")
# ── Routes ─────────────────────────────────────────────────────────────────

@app.post("/entry")
async def create_entry(body: EntryRequest, user_id: str = Depends(get_current_user_id)):
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

        await remember(time_anchored_text, user_id)

        # Extract real triples from this entry and store in graph
        try:
            memories = await recall(body.text, user_id)
            memories = list(dict.fromkeys(memories))
            await _extract_and_store_triples(user_id, time_anchored_text, memories, source_memory=time_anchored_text)
        except Exception:
            pass  # Don't fail the entry if graph extraction fails

        return {"status": "saved"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})


@app.post("/query")
async def query_memory(body: QueryRequest, user_id: str = Depends(get_current_user_id)):
    """
    Query Cognee's graph memory for relevant diary entries.
    Returns an empty list if no entries have been saved yet,
    rather than crashing on a missing vector table.
    """
    try:
        if not body.query.strip():
            raise HTTPException(status_code=400, detail="Query must not be empty.")

        results = await recall(body.query, user_id)
        graph_hits = _search_graph_triples(user_id, body.query)
        combined = list(dict.fromkeys([*results, *graph_hits]))
        return {"answer": combined}
    except HTTPException:
        raise
    except Exception as e:
        err = str(e).lower()
        if "textsummary" in err or "does not exist" in err or "no such table" in err:
            return {"answer": []}
        raise HTTPException(status_code=500, detail={"error": str(e)})


@app.get("/graph")
async def get_graph(user_id: str = Depends(get_current_user_id)):
    try:
        g = _load_graph(user_id)
        nodes = [{"id": nid, "label": label} for label, nid in g["nodes"].items()]
        edges = [{"source": e["source"], "target": e["target"], "label": e["label"]} for e in g["edges"]]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"--> [Graph error]: {e}")
        return {"nodes": [], "edges": []}

class ChatMessage(BaseModel):
    role: str
    content: str



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
            "description": "Check the user's stored memories/diary history before answering any question about something they may have told you before — dates, names, facts, past events, decisions, feelings, anything. Call this whenever there's a reasonable chance the answer already exists in memory, even if the user's phrasing is indirect (e.g. 'do you know...', 'did I mention...', 'what was it again...'). It is always better to check memory first than to answer from guesswork.",
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

Call remember_entry whenever the user's message contains ANY personal fact, preference, feeling, opinion, event, or experience about themselves — even if it's only one sentence inside an otherwise casual message, and even if they also asked you something. Extract and save just the personal part as the "text" argument; you can still answer the rest of the message conversationally in your reply.

Examples that SHOULD trigger remember_entry:
- "I really like chocolate, what's your favorite?" -> save "User really likes chocolate"
- "Ugh, work was exhausting today, anyway what's the weather like?" -> save "User found work exhausting today"
- "My sister's getting married in June" -> save the whole thing
- "When did I last see my friend Alex? I think it was in March." -> save "User last saw their friend Alex in March"

Examples that should NOT trigger remember_entry — no personal content at all:
- "hey", "how are you", "what can you do", "can you help me with something"

Call recall_memory whenever the user asks about something you might already know from their memories — not just direct questions like "when did I...", but also indirect ones like "do you know...", "did I ever mention...", "what was it again", or "do you remember X". If there's a reasonable chance the answer is already stored, check before answering — don't rely on what's just in this conversation so far.

Examples that SHOULD trigger recall_memory:
- "When did I start my business?"
- "Do you know the date?" (following an earlier conversation about an event)
- "Did I ever tell you my sister's name?"
- "What did I say I wanted to do this weekend?"

Examples that should NOT trigger recall_memory — nothing to look up:
- "What's the weather like?", "What can you do?", general chit-chat with no reference to the user's own past

For everything else, just respond conversationally without using any tool."""


async def _safe_completion_with_tools(client, messages_list):
    """
    Groq's Llama tool-calling occasionally emits a malformed pseudo-function
    call (e.g. literal "<function=...>" text) instead of a properly
    structured tool call, and the API rejects it with a 400 tool_use_failed
    error. Retry once with tools enabled — this is often just a one-off
    generation flake — then fall back to a tool-less completion so a single
    bad generation doesn't crash the whole request and lose the user's
    message entirely.
    """
    for attempt in range(2):
        try:
            return await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages_list,
                tools=TOOLS,
                tool_choice="auto",
            )
        except Exception as e:
            err_str = str(e)
            if "tool_use_failed" not in err_str and "Failed to call a function" not in err_str:
                raise
            print(f"⚠️ Tool call generation failed (attempt {attempt + 1}/2): {err_str}")

    print("⚠️ Falling back to a tool-less response after repeated tool_use_failed errors")
    return await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages_list,
        tool_choice="none",
    )


@app.post("/chat")
async def chat(body: ChatRequest, user_id: str = Depends(get_current_user_id)):
    try:
        import json
        import re
        from groq import AsyncGroq
        from datetime import datetime, timezone
        from bson import ObjectId

        client = AsyncGroq(api_key=os.environ.get("LLM_API_KEY"))

        messages_list = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in body.history:
            # Check if it's a dict or an object to be absolutely bulletproof
            if isinstance(msg, dict):
                messages_list.append({"role": msg.get("role"), "content": msg.get("content")})
            else:
                messages_list.append({"role": msg.role, "content": msg.content})

        messages_list.append({"role": "user", "content": body.message})


        response = await _safe_completion_with_tools(client, messages_list)

        choice = response.choices[0]
        reply = choice.message.content or "I'm not sure how to respond."
        action = "chat"

        # Handle Tool Calls (remember / recall)
        if choice.message.tool_calls:
            tool_call = choice.message.tool_calls[0]
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)
            tool_id = tool_call.id

            if fn_name == "remember_entry":
                text = fn_args["text"]
                current_date = datetime.now().strftime("%B %d, %Y")
                time_anchored_text = f"On {current_date}: {text}"

                await remember(time_anchored_text, user_id)
                try:
                    memories = await recall(text, user_id)
                    memories = list(dict.fromkeys(memories))
                    await _extract_and_store_triples(user_id, time_anchored_text, memories, source_memory=time_anchored_text)
                except:
                    pass

                follow_up = messages_list + [
                    {
                        "role": "assistant",
                        "content": choice.message.content,
                        "tool_calls": [
                            {
                                "id": tool_call.id,
                                "type": "function",
                                "function": {
                                    "name": tool_call.function.name,
                                    "arguments": tool_call.function.arguments,
                                },
                            }
                        ],
                    },
                    {"role": "tool", "tool_call_id": tool_id, "name": fn_name, "content": f"Memory saved: {time_anchored_text}"},
                    {"role": "user", "content": "Answer my question conversationally using those memories."}
                ]
                r2 = await client.chat.completions.create(model="llama-3.3-70b-versatile", messages=follow_up, temperature=0)
                reply = r2.choices[0].message.content
                action = "remember"

            elif fn_name == "recall_memory":
                query = fn_args["query"]
                results = await recall(query, user_id)
                graph_hits = _search_graph_triples(user_id, query)
                # Combine both sources, de-duplicated — the graph catches
                # specific facts that semantic chunk search sometimes misses.
                combined = list(dict.fromkeys([*results, *graph_hits]))
                context = "\n".join(combined) if combined else "No memories found."

                # TEMP DEBUG: remove once recall reliability is confirmed.
                # Shows exactly what the model searched for and what each
                # source returned, so a failed lookup can be diagnosed from
                # the server log instead of guessed at.
                print(f"🔍 recall_memory query={query!r}")
                print(f"🔍   cognee results ({len(results)}): {results}")
                print(f"🔍   graph_hits ({len(graph_hits)}): {graph_hits}")

                follow_up = messages_list + [
                    {
                        "role": "assistant",
                        "content": choice.message.content,
                        "tool_calls": [
                            {
                                "id": tool_call.id,
                                "type": "function",
                                "function": {
                                    "name": tool_call.function.name,
                                    "arguments": tool_call.function.arguments,
                                },
                            }
                        ],
                    },
                    {"role": "tool", "tool_call_id": tool_id, "name": fn_name, "content": context},
                    {"role": "user", "content": "The tool result above contains real facts retrieved from the user's memory — treat them as true and already established, not as something to second-guess. Answer my question directly using them. Only say you don't have the memory if the tool result is literally empty or truly unrelated to what I asked."}
                ]
                r2 = await client.chat.completions.create(model="llama-3.3-70b-versatile", messages=follow_up, temperature=0)
                reply = r2.choices[0].message.content
                action = "recall"

        # === SAVE MESSAGES TO DATABASE ===
        if body.conversationId:
            conv_id = body.conversationId
            db_conv_id = ObjectId(conv_id)

            # FIX: previously this block wrote messages into whatever
            # conversationId the client sent with zero ownership check — any
            # authenticated user could pass another user's conversation id
            # and have their messages saved into it. Verify ownership first,
            # matching the same rule used in conversations.py, and do it
            # BEFORE writing anything.
            conv_doc = await conversations.find_one({
                "_id": db_conv_id,
                "$or": [
                    {"user_id": user_id},
                    {"user_id": {"$exists": False}}
                ]
            })
            if not conv_doc:
                raise HTTPException(status_code=403, detail="You don't have access to this conversation")

            print(f"💾 Saving to conversation: {conv_id}")

            # 1. Save user message using the proper ObjectId
            await messages.insert_one({
                "conversation_id": db_conv_id,
                "role": "user",
                "content": body.message,
                "timestamp": datetime.now(timezone.utc)
            })

            # 2. Save assistant response using the proper ObjectId
            await messages.insert_one({
                "conversation_id": db_conv_id,
                "role": "assistant",
                "content": reply,
                "action": action,
                "timestamp": datetime.now(timezone.utc)
            })

            # 3. Update the timestamp and conditionally update the title
            update_payload = {
                "updated_at": datetime.now(timezone.utc)
            }

            # FIX: was matching a hardcoded list of placeholder strings
            # ("New Chat Session" / "New Chat" / "" / None) that never matched
            # the actual default title ("New Conversation") set in conversations.py,
            # so the title never got renamed. Use an explicit title_set flag instead.
            if conv_doc and not conv_doc.get("title_set", False):
                update_payload["title"] = body.message[:25] + "..." if len(body.message) > 25 else body.message
                update_payload["title_set"] = True

            await conversations.update_one(
                {"_id": db_conv_id},
                {"$set": update_payload}
            )

            print(f"✅ Saved messages and updated attributes for {conv_id}")

        return {"reply": reply, "action": action}

    except HTTPException:
        raise
    except Exception as e:
        print("Chat Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
async def get_history(user_id: str = Depends(get_current_user_id)):
    try:
        results = await recall("User long-term memory profile, permanent facts, core timeline, life events, and chronological summary.", user_id)

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