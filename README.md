# Travel Planner Agent (Google ADK + Next.js + Thesys)

This project contains:
- `backend/`: Python API using Google ADK + FastAPI with travel tools.
- `frontend/`: Next.js + TypeScript UI using Thesys `C1Chat`.

## 1) Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set your key in `backend/.env`:

```bash
THESYS_API_KEY=your_key_here
```

Run backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 2) Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Request flow

1. `C1Chat` sends messages to `frontend/app/api/chat/route.ts`.
2. Next.js route proxies to `backend` `/api/chat`.
3. Backend uses ADK `LlmAgent` with travel tools and streams SSE chunks back.

## Included tools

- `search_flights`
- `search_hotels`
- `build_daily_itinerary`
- `summarize_trip_plan`

These use deterministic mock data so the agent is runnable without external travel APIs.
