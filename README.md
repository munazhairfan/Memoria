# Memoria 🪶

**Your AI has a hangover and woke up with no memory. Give it one.**

Memoria is a conversational AI diary that actually remembers you. Talk to it the way you'd talk to a journal — share what happened in your day, how you're feeling, what you're working on — and it builds a real, persistent memory of your life over time using [Cognee](https://www.cognee.ai/), then lets you see that memory as an explorable knowledge graph.

Built for The Hangover — theme: giving AI real, lasting memory.

---

## What it does

- **Chat like a diary.** Memoria decides on its own when something you say is worth remembering, and saves it — no manual "save entry" step required.
- **Recalls naturally.** Ask it about something you mentioned before ("when did I start my business?") and it searches its actual memory to answer, rather than guessing.
- **Visualizes your memory.** The `/memories` page renders your knowledge graph — people, events, dates, feelings — as connected nodes you can drag around and explore.
- **Summarizes your history.** A running narrative summary of "who you are so far," synthesized from everything Memoria has learned about you.
- **Fully multi-user.** Every account gets its own isolated memory — built on Cognee's real multi-tenant user system, not a naming convention layered on top.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS, React Flow |
| Backend | FastAPI (Python) |
| App data (users, conversations, messages) | MongoDB |
| AI memory (the actual point of this project) | [Cognee](https://www.cognee.ai/) — vector + graph memory engine |
| LLM | Groq (Llama 3.3 70B) |
| Auth | JWT, bcrypt password hashing |

## Architecture, briefly

Two databases doing two different jobs:

- **MongoDB** owns your app's operational data — accounts, conversations, message history. Ordinary structured records.
- **Cognee** owns the actual *memory* — the vector and graph storage that lets the AI recall facts and relationships, not just retrieve raw text. Each app user is bridged to a real, isolated Cognee user at registration, so memory storage is physically separated per person, not just filtered.

```
frontend (Next.js)  →  backend (FastAPI)  →  MongoDB   (accounts, chats)
                                          ↘
                                            Cognee    (memory, graph, recall)
```

The `/chat` endpoint uses LLM tool-calling to decide, per message, whether to `remember_entry` (save something new), `recall_memory` (look something up), or just respond conversationally.

## Project structure

```
backend/
  main.py              # FastAPI app, /chat /entry /query /graph /history routes
  auth.py               # JWT + password hashing
  cognee_client.py      # Bridges app users to real Cognee users; remember()/recall()
  config.py             # Cognee embedding + storage config
  database.py           # MongoDB connection
  models.py             # Pydantic request/response models
  routers/
    auth.py              # /auth/register, /auth/login, /auth/me
    conversations.py      # CRUD for chat conversations
  graphs/                # Per-user extracted knowledge graph JSON (see note below)

frontend/
  app/
    page.tsx                    # Landing page
    login/, register/           # Auth pages
    (protected)/
      layout.tsx                # Auth guard + shared header for logged-in pages
      diary/page.tsx            # Main chat interface
      memories/page.tsx          # Graph visualization + history summary
      profile/page.tsx           # Account page, logout
  src/
    api.ts                      # All backend API calls
    components/                 # Header, ChatSidebar, AuthCard
    lib/auth.ts                  # Client-side JWT validity check
```

## Running locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
export MONGO_URI="your-mongodb-atlas-uri"
export LLM_API_KEY="your-groq-api-key"
export JWT_SECRET_KEY=$(openssl rand -hex 32)
uvicorn backend.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
# create .env.local with:
# NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
npm run dev
```

Visit `http://localhost:3000`, register an account, and start chatting.

## Deploying

**Backend (Render recommended):**
- Connect your GitHub repo, select the `backend/` folder as root (or adjust the start command's path accordingly)
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `MONGO_URI`, `LLM_API_KEY`, `JWT_SECRET_KEY`
- **Important:** Cognee stores memory data as local files (`backend/cognee_system/`, `backend/graphs/`). Attach a persistent **disk** mounted over these paths — without one, every redeploy wipes everyone's memory. Check current pricing for disk add-ons before assuming it's free.
- Railway works identically if you'd rather use it (same start command, same env vars, same volume requirement) — just requires the Hobby plan ($5/mo minimum) once a trial's been used.

**Frontend (Vercel or Render):**
- Set `NEXT_PUBLIC_API_BASE` to the backend's public URL.

## Known limitations

Being upfront about what's rough around the edges, in the spirit of honest engineering:

- Graph entity resolution is prompt-based, not embedding-based — the model is instructed to reuse existing entity names, but can occasionally still create a near-duplicate node with slightly different wording.
- No retry/backoff on Groq API calls beyond a single fallback for malformed tool-call generations.
- The per-user knowledge graph is stored as JSON files rather than in a database — functional, but not how it'd be built with more time.

## Credits

Built with [Cognee](https://www.cognee.ai/) for AI memory, [Groq](https://groq.com/) for fast LLM inference, and [Claude Code](https://www.anthropic.com/claude-code) for development assistance.