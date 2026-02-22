# Travel Planner Agent (Google ADK + Next.js + Thesys)

Travel planning assistant with:
- Python backend (`FastAPI` + `google-adk` + Thesys-compatible model endpoint)
- Next.js frontend (`C1Chat` + custom Thesys components)
- Deterministic mock tools for flights, hotels, itinerary, budget
- Interactive component triggers for selection and refinement

## Project structure

- `backend/`
  - `main.py`: FastAPI server + `/api/chat` SSE endpoint
  - `agent.py`: ADK `LlmAgent` runtime
  - `custom_components.py`: JSON schemas passed to C1 model metadata
  - `tools/`: mock travel tools
- `frontend/`
  - `app/page.tsx`: `C1Chat` + `customizeC1.customComponents` registration
  - `app/components.tsx`: `FlightList`, `HotelCardGrid`, `ItineraryTimeline`, `BudgetBreakdown`
  - `app/globals.css`: custom component styles

## Features

- Custom component rendering for travel recommendations.
- Trigger actions from UI (`select_flight`, `select_hotel`, `compare_*`, etc.).
- Staged flow:
  1. User selects flight + hotel first.
  2. Itinerary and budget are then shown/refined.
- Mock image support in flights/hotels/itinerary via `image_url`.

## Prerequisites

Before running the project, make sure you have:

- Python 3.10+ and `pip`
- Node.js 20+ and `npm`
- A Thesys API key (`THESYS_API_KEY`)
- Open ports `3000` (frontend) and `8000` (backend)

## 1) Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set your key in `backend/.env`:

```bash
THESYS_API_KEY=your_key_here
```

Optional env vars:

```bash
THESYS_BASE_URL=https://api.thesys.dev/v1/embed
THESYS_MODEL=openai/c1/anthropic/claude-sonnet-4/v-20251230
FRONTEND_URL=http://localhost:3000
PORT=8000
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

1. `C1Chat` sends requests directly to backend `http://127.0.0.1:8000/api/chat`.
2. Backend runs ADK agent + tools and streams SSE chunks.
3. C1 renders responses and custom components.

Note: This repo does not use a Next.js API proxy route.

## Custom components

Registered in `frontend/app/page.tsx` via:
- `FlightList`
- `HotelCardGrid`
- `ItineraryTimeline`
- `BudgetBreakdown`

Schemas are defined in `backend/custom_components.py` and sent via model `metadata` in `backend/agent.py`.

## Trigger protocol

UI actions in `frontend/app/components.tsx` call `useOnAction()` and send:

```text
COMPONENT_TRIGGER {"source":"travel_custom_component","action":"...","payload":{...}}
```

Backend system prompt in `backend/config.py` tells the model how to interpret these triggers and continue the staged flow.

## Mock tools

Included tools:
- `search_flights`
- `search_hotels`
- `build_daily_itinerary`
- `summarize_trip_plan`

All tools return deterministic mock data. Flights/hotels/itinerary items include `image_url` so components can render images.

## Development notes

- If custom buttons/images do not appear, verify the response is using your custom components (not default C1 cards).
- Restart backend after prompt/schema changes.
- Start a fresh thread after major prompt-flow changes so old context does not interfere.
