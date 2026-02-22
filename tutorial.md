# How to Build a Travel Planner AI Agent with Google ADK, Thesys C1, and Next.js

In this tutorial, you'll build an interactive travel planning assistant from scratch. The agent searches flights, hotels, and builds itineraries — all rendered as rich, interactive UI components the user can click to refine their trip.

**What you'll build:**

- A **Python backend** using FastAPI and Google's Agent Development Kit (ADK) with tool-calling
- A **Next.js frontend** using the Thesys C1Chat SDK for interactive AI-rendered components
- **Custom components** (flight cards, hotel grids, itinerary timelines, budget charts) that the AI model invokes by name
- A **trigger protocol** where UI button clicks send structured payloads back to the agent

**Tech stack:**

| Layer | Technology |
|-------|-----------|
| Agent framework | [Google ADK](https://github.com/google/adk-python) (`google-adk`) |
| Model endpoint | Thesys C1 (OpenAI-compatible via LiteLLM) |
| Backend server | FastAPI + Uvicorn |
| Frontend framework | Next.js 15 (React 19) |
| Chat UI | `@thesysai/genui-sdk` (`C1Chat` component) |
| Styling | Vanilla CSS |

## Prerequisites

Before starting, make sure you have:

- **Python 3.10+** and `pip`
- **Node.js 20+** and a package manager (`npm` or `pnpm`)
- A **Thesys API key** — sign up at [thesys.dev](https://thesys.dev) if you don't have one
- Ports **3000** (frontend) and **8000** (backend) available

## Step 1: Project Scaffolding

Create the project structure. The backend and frontend are fully decoupled — no Next.js API proxy is needed. The frontend's `C1Chat` component calls the backend directly.

```bash
mkdir travel-planner && cd travel-planner

# Backend
mkdir -p backend/tools
touch backend/__init__.py backend/config.py backend/custom_components.py \
      backend/agent.py backend/main.py backend/requirements.txt \
      backend/.env backend/tools/__init__.py backend/tools/flight_tools.py \
      backend/tools/hotel_tools.py backend/tools/itinerary_tools.py

# Frontend (Next.js)
npx -y create-next-app@latest frontend --typescript --eslint \
  --no-tailwind --app --src-dir=false --import-alias="@/*" --use-npm
```

Your final structure will look like this:

```
travel-planner/
├── backend/
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── flight_tools.py
│   │   ├── hotel_tools.py
│   │   └── itinerary_tools.py
│   ├── __init__.py
│   ├── agent.py
│   ├── config.py
│   ├── custom_components.py
│   ├── main.py
│   └── requirements.txt
└── frontend/
    └── app/
        ├── components.tsx
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
```

### Install dependencies

**Backend:**

Create `backend/requirements.txt`:

```txt
fastapi
uvicorn[standard]
python-dotenv
litellm
google-adk
pydantic>=2,<3
```

Then install:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**

```bash
cd frontend
npm install @thesysai/genui-sdk @crayonai/react-ui
```

## Step 2: Backend Configuration (`config.py`)

Start with the simplest backend file — loading environment variables and defining the system prompt.

Create `backend/.env`:

```bash
THESYS_API_KEY=your_thesys_api_key
THESYS_BASE_URL=https://api.thesys.dev/v1/embed
THESYS_MODEL=openai/c1/anthropic/claude-sonnet-4/v-20251230
APP_NAME=travel_planner
DEFAULT_USER_ID=demo_user
FRONTEND_URL=http://localhost:3000
PORT=8000
```

Now create `backend/config.py`:

```python
"""Configuration for the Travel Planner backend."""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

THESYS_API_KEY = os.getenv("THESYS_API_KEY", "")
THESYS_BASE_URL = os.getenv("THESYS_BASE_URL", "https://api.thesys.dev/v1/embed")
THESYS_MODEL = os.getenv(
    "THESYS_MODEL", "openai/c1/anthropic/claude-sonnet-4/v-20251230"
)

APP_NAME = os.getenv("APP_NAME", "travel_planner")
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "demo_user")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PORT = int(os.getenv("PORT", "8000"))
```

Next, add the **system prompt**. This is the most important design decision in the project — it tells the model *how* to behave, *which tools* to call, and *which custom components* to render.

Add this to the bottom of `config.py`:

```python
SYSTEM_PROMPT = """
You are Travel Planner Pro, an expert itinerary assistant.

When useful, call tools to gather flights, hotels, and itinerary options.
Always return concise but structured plans with:
- Flight recommendation
- Hotel recommendation
- Day-by-day itinerary
- Estimated budget summary

If user constraints are missing, ask one short clarification question.

When presenting travel recommendations, prefer these custom components when data is available:
- FlightList for multiple flight options.
- HotelCardGrid for multiple hotel options.
- ItineraryTimeline for day-by-day plans.
- BudgetBreakdown for cost summaries.

Use exact property names defined by each component schema and avoid adding unknown fields.
When available from tool outputs, include `image_url` fields in FlightList, HotelCardGrid, and ItineraryTimeline items.

If you receive a message line starting with `COMPONENT_TRIGGER ` followed by JSON:
- Parse the JSON payload and treat it as an explicit user UI action.
- Honor selected IDs (flight/hotel) as hard preferences unless user asks to change.
- Return refreshed recommendations, again using custom components.

Conversation flow requirements:
- Initial recommendation step: render FlightList and HotelCardGrid so the user can select.
- Do not render ItineraryTimeline or BudgetBreakdown until both flight and hotel have been selected.
- After `select_flight` and `select_hotel` triggers are both present, generate and render itinerary and budget.
""".strip()
```

There are three key design decisions in this prompt:

1. **Custom component names** — The model is told to use `FlightList`, `HotelCardGrid`, etc. These names must exactly match the component schemas (Step 5) and the React components (Step 9).
2. **Staged conversation flow** — Flights and hotels are shown first. Itinerary and budget are gated behind user selections — the model won't render them until both a flight and hotel have been chosen.
3. **COMPONENT_TRIGGER protocol** — When a user clicks a button in the UI, the frontend sends a structured JSON message prefixed with `COMPONENT_TRIGGER`. The prompt tells the model how to parse and respond to these triggers.

## Step 3: Mock Travel Tools (`tools/`)

Before building the agent, build the tools it will call. Google ADK automatically discovers tool schemas from Python function signatures and docstrings — no manual schema registration needed.

> **Note:** These tools return deterministic mock data using SHA-256 hashing so outputs are stable across runs. In production, you'd replace these with real API calls (Amadeus, Booking.com, etc.).

### Flight search (`tools/flight_tools.py`)

```python
"""Flight search tools for the Travel Planner agent."""

from __future__ import annotations

import hashlib
from typing import Any


def _stable_int(seed: str, low: int, high: int) -> int:
    """Hash-based deterministic random integer in [low, high]."""
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16)
    return low + (value % (high - low + 1))


def _mock_image_url(seed: str, width: int = 720, height: int = 420) -> str:
    """Return a deterministic image URL for mock cards."""
    safe_seed = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    return f"https://picsum.photos/seed/{safe_seed}/{width}/{height}"


def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    travelers: int = 1,
    cabin_class: str = "economy",
) -> list[dict[str, Any]]:
    """Return mock flight options for a route and date.

    Args:
        origin: Departure city or airport.
        destination: Arrival city or airport.
        departure_date: ISO date string (YYYY-MM-DD).
        travelers: Number of travelers.
        cabin_class: economy, premium_economy, business, first.
    """
    airlines = ["SkyJet", "Atlas Air", "Horizon Lines"]
    options: list[dict[str, Any]] = []

    for idx, airline in enumerate(airlines, start=1):
        seed = f"{origin}-{destination}-{departure_date}-{airline}-{cabin_class}"

        base_price = _stable_int(seed, 180, 820)
        duration_h = _stable_int(seed + "-duration", 2, 14)
        stops = _stable_int(seed + "-stops", 0, 2)
        depart_hour = _stable_int(seed + "-depart", 5, 21)
        price = base_price * max(1, travelers)

        options.append(
            {
                "flight_id": f"FL-{idx:03d}",
                "airline": airline,
                "origin": origin,
                "destination": destination,
                "departure_date": departure_date,
                "departure_time_local": f"{depart_hour:02d}:15",
                "duration_hours": duration_h,
                "stops": stops,
                "cabin_class": cabin_class,
                "total_price_usd": price,
                "image_url": _mock_image_url(f"{seed}-image"),
            }
        )

    return sorted(options, key=lambda item: item["total_price_usd"])
```

ADK reads the `search_flights` function signature — parameter names, type hints, and the docstring — and automatically generates the JSON-schema the model uses for tool calling. You don't need to register schemas manually.

### Hotel search (`tools/hotel_tools.py`)

```python
"""Hotel search tools for the Travel Planner agent."""

from __future__ import annotations

import hashlib
from typing import Any


def _stable_int(seed: str, low: int, high: int) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    value = int(digest[8:16], 16)
    return low + (value % (high - low + 1))


def _mock_image_url(seed: str, width: int = 720, height: int = 420) -> str:
    safe_seed = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    return f"https://picsum.photos/seed/{safe_seed}/{width}/{height}"


def search_hotels(
    city: str,
    check_in_date: str,
    check_out_date: str,
    guests: int = 2,
    rooms: int = 1,
) -> list[dict[str, Any]]:
    """Return mock hotels for a city and date range."""
    hotel_names = [
        "Harbor View Suites",
        "Grand Central Hotel",
        "Maple & Stone Boutique",
        "Lumen Stay",
    ]
    results: list[dict[str, Any]] = []

    for idx, name in enumerate(hotel_names, start=1):
        seed = f"{city}-{check_in_date}-{check_out_date}-{name}-{guests}-{rooms}"

        nightly = _stable_int(seed, 90, 420)
        rating = round(_stable_int(seed + "-rating", 38, 49) / 10, 1)
        walk_score = _stable_int(seed + "-walk", 60, 98)

        results.append(
            {
                "hotel_id": f"HT-{idx:03d}",
                "name": name,
                "city": city,
                "check_in_date": check_in_date,
                "check_out_date": check_out_date,
                "guests": guests,
                "rooms": rooms,
                "nightly_rate_usd": nightly,
                "star_rating": rating,
                "walkability_score": walk_score,
                "amenities": ["wifi", "breakfast", "gym"],
                "image_url": _mock_image_url(f"{seed}-image"),
            }
        )

    return sorted(results, key=lambda item: (item["nightly_rate_usd"], -item["star_rating"]))
```

### Itinerary and budget tools (`tools/itinerary_tools.py`)

```python
"""Itinerary planning tools for the Travel Planner agent."""

from __future__ import annotations

from datetime import date, timedelta
import hashlib
from typing import Any


def _mock_image_url(seed: str, width: int = 960, height: int = 540) -> str:
    safe_seed = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    return f"https://picsum.photos/seed/{safe_seed}/{width}/{height}"


def build_daily_itinerary(
    destination: str,
    start_date: str,
    end_date: str,
    interests: list[str] | None = None,
    pace: str = "balanced",
) -> list[dict[str, Any]]:
    """Create a day-by-day itinerary skeleton with activities."""
    interests = interests or ["food", "landmarks", "local culture"]

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    if end < start:
        raise ValueError("end_date must be on or after start_date")

    activity_bank = {
        "food": ["street food tour", "chef tasting menu", "local market crawl"],
        "nature": ["sunrise viewpoint", "city park walk", "coastal trail"],
        "landmarks": ["historic district", "architecture walk", "museum visit"],
        "shopping": ["artisan market", "design district", "bookstore crawl"],
        "local culture": ["neighborhood walk", "live music venue", "cultural center"],
    }

    schedule: list[dict[str, Any]] = []
    day_count = (end - start).days + 1
    slots_per_day = 2 if pace == "slow" else 4 if pace == "fast" else 3

    for offset in range(day_count):
        current = start + timedelta(days=offset)
        picks: list[str] = []
        for slot in range(slots_per_day):
            interest = interests[(offset + slot) % len(interests)]
            choices = activity_bank.get(interest, activity_bank["local culture"])
            picks.append(f"{destination}: {choices[(offset + slot) % len(choices)]}")

        schedule.append(
            {
                "date": current.isoformat(),
                "pace": pace,
                "activities": picks,
                "image_url": _mock_image_url(
                    f"{destination}-{current.isoformat()}-{pace}"
                ),
            }
        )

    return schedule


def summarize_trip_plan(
    flights: list[dict[str, Any]],
    hotels: list[dict[str, Any]],
    itinerary: list[dict[str, Any]],
    travelers: int = 1,
) -> dict[str, Any]:
    """Build a high-level trip summary and cost estimate."""
    best_flight = flights[0] if flights else None
    best_hotel = hotels[0] if hotels else None

    nights = max(0, len(itinerary) - 1)
    flight_cost = int(best_flight["total_price_usd"]) if best_flight else 0
    hotel_cost = int(best_hotel["nightly_rate_usd"]) * nights if best_hotel else 0
    food_local = 65 * max(1, len(itinerary)) * max(1, travelers)

    return {
        "recommended_flight": best_flight,
        "recommended_hotel": best_hotel,
        "itinerary_days": len(itinerary),
        "estimated_cost_breakdown_usd": {
            "flight": flight_cost,
            "hotel": hotel_cost,
            "food_and_local_transport": food_local,
            "total_estimate": flight_cost + hotel_cost + food_local,
        },
    }
```

The `summarize_trip_plan` tool produces data shaped exactly like the `BudgetBreakdown` component expects — `estimated_cost_breakdown_usd` with `flight`, `hotel`, `food_and_local_transport`, and `total_estimate` fields.

### Export tools (`tools/__init__.py`)

```python
"""Travel planning tools exposed to the ADK agent."""

from .flight_tools import search_flights
from .hotel_tools import search_hotels
from .itinerary_tools import build_daily_itinerary, summarize_trip_plan

__all__ = [
    "search_flights",
    "search_hotels",
    "build_daily_itinerary",
    "summarize_trip_plan",
]
```

## Step 4: Custom Component Schemas (`custom_components.py`)

This file is the **bridge between backend and frontend**. It defines JSON schemas for each custom component. The schemas are serialized into Thesys metadata and passed to the model, telling it exactly what data shape to produce when it wants to render a component.

> **Key rule:** The schema key names (e.g., `FlightList`, `HotelCardGrid`) must exactly match the React component names registered on the frontend.

```python
"""Schemas for frontend Thesys custom components."""

from __future__ import annotations

import json
from typing import Any


def _obj(description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    """Helper to enforce consistent JSON-schema structure."""
    return {
        "type": "object",
        "description": description,
        "properties": properties,
        "required": required,
        "additionalProperties": False,
    }


# Individual item schemas

FLIGHT_SCHEMA: dict[str, Any] = _obj(
    "Represents a single flight option for a route and date.",
    properties={
        "flight_id": {"type": "string", "description": "Unique flight identifier."},
        "airline": {"type": "string", "description": "Airline name."},
        "origin": {"type": "string", "description": "Departure airport or city."},
        "destination": {"type": "string", "description": "Arrival airport or city."},
        "departure_date": {"type": "string", "description": "Departure date YYYY-MM-DD."},
        "departure_time_local": {"type": "string", "description": "Local departure time HH:MM."},
        "duration_hours": {"type": "number", "description": "Total flight duration in hours."},
        "stops": {"type": "integer", "description": "Number of stops."},
        "cabin_class": {"type": "string", "description": "Cabin class."},
        "total_price_usd": {"type": "number", "description": "Total price in USD."},
        "image_url": {"type": "string", "description": "Optional preview image URL."},
    },
    required=[
        "flight_id", "airline", "origin", "destination", "departure_date",
        "departure_time_local", "duration_hours", "stops", "cabin_class", "total_price_usd",
    ],
)

HOTEL_SCHEMA: dict[str, Any] = _obj(
    "Represents a hotel option including nightly rate and trip dates.",
    properties={
        "hotel_id": {"type": "string", "description": "Unique hotel identifier."},
        "name": {"type": "string", "description": "Hotel name."},
        "city": {"type": "string", "description": "City where hotel is located."},
        "check_in_date": {"type": "string", "description": "Check-in date YYYY-MM-DD."},
        "check_out_date": {"type": "string", "description": "Check-out date YYYY-MM-DD."},
        "guests": {"type": "integer", "description": "Number of guests."},
        "rooms": {"type": "integer", "description": "Number of rooms."},
        "nightly_rate_usd": {"type": "number", "description": "Nightly price in USD."},
        "star_rating": {"type": "number", "description": "Star rating, e.g. 4.5."},
        "walkability_score": {"type": "integer", "description": "Walkability score 0-100."},
        "amenities": {"type": "array", "items": {"type": "string"}, "description": "Amenities."},
        "image_url": {"type": "string", "description": "Optional preview image URL."},
    },
    required=[
        "hotel_id", "name", "city", "check_in_date", "check_out_date",
        "guests", "rooms", "nightly_rate_usd", "star_rating", "walkability_score", "amenities",
    ],
)

ITINERARY_DAY_SCHEMA: dict[str, Any] = _obj(
    "Represents one day in the itinerary timeline.",
    properties={
        "date": {"type": "string", "description": "Date YYYY-MM-DD."},
        "pace": {"type": "string", "description": "Travel pace for the day."},
        "activities": {"type": "array", "items": {"type": "string"}, "description": "Activities."},
        "image_url": {"type": "string", "description": "Optional cover image URL."},
    },
    required=["date", "pace", "activities"],
)

BUDGET_BREAKDOWN_SCHEMA: dict[str, Any] = _obj(
    "Trip cost estimate in USD broken down by category.",
    properties={
        "flight": {"type": "number", "description": "Estimated flight total in USD."},
        "hotel": {"type": "number", "description": "Estimated hotel total in USD."},
        "food_and_local_transport": {"type": "number", "description": "Food and transport total."},
        "total_estimate": {"type": "number", "description": "Overall trip estimate in USD."},
    },
    required=["flight", "hotel", "food_and_local_transport", "total_estimate"],
)


# Compose into component-level schemas

CUSTOM_COMPONENT_SCHEMAS: dict[str, Any] = {
    "FlightList": _obj(
        "Displays multiple flight options in an interactive selectable list.",
        properties={
            "title": {"type": "string", "description": "Optional title above flight cards."},
            "flights": {"type": "array", "items": FLIGHT_SCHEMA, "description": "Flight options."},
        },
        required=["flights"],
    ),
    "HotelCardGrid": _obj(
        "Displays hotel options in a selectable card grid.",
        properties={
            "title": {"type": "string", "description": "Optional title above hotel cards."},
            "hotels": {"type": "array", "items": HOTEL_SCHEMA, "description": "Hotel options."},
        },
        required=["hotels"],
    ),
    "ItineraryTimeline": _obj(
        "Displays a day-by-day itinerary timeline with activities.",
        properties={
            "title": {"type": "string", "description": "Optional section title."},
            "days": {"type": "array", "items": ITINERARY_DAY_SCHEMA, "description": "Itinerary days."},
        },
        required=["days"],
    ),
    "BudgetBreakdown": _obj(
        "Displays a visual budget summary for trip costs.",
        properties={
            "title": {"type": "string", "description": "Optional section title."},
            "estimated_cost_breakdown_usd": BUDGET_BREAKDOWN_SCHEMA,
        },
        required=["estimated_cost_breakdown_usd"],
    ),
}

# Serialize into the metadata format Thesys expects
THESYS_CUSTOM_COMPONENT_METADATA: dict[str, str] = {
    "thesys": json.dumps({"c1_custom_components": CUSTOM_COMPONENT_SCHEMAS})
}
```

The final `THESYS_CUSTOM_COMPONENT_METADATA` dict is what gets passed to the model via `LiteLlm(metadata=...)`. It tells the Thesys C1 model: "Here are the rich UI components you can render, and here are their exact data shapes."

## Step 5: Agent Runtime (`agent.py`)

This is the core of the backend — it wires together the model, tools, session management, and streaming.

```python
"""Google ADK Travel Planner agent configuration and runtime helpers."""

from __future__ import annotations

import os
from typing import AsyncGenerator

from google.adk.agents import LlmAgent
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from config import (
    APP_NAME, DEFAULT_USER_ID, SYSTEM_PROMPT,
    THESYS_API_KEY, THESYS_BASE_URL, THESYS_MODEL,
)
from custom_components import THESYS_CUSTOM_COMPONENT_METADATA
from tools import build_daily_itinerary, search_flights, search_hotels, summarize_trip_plan


class TravelPlannerAgent:
    """ADK-backed travel planner with tool-calling support."""

    def __init__(self) -> None:
        if not THESYS_API_KEY:
            raise ValueError("THESYS_API_KEY is required. Set it in backend/.env")

        # ADK's LiteLLM adapter reads OpenAI-compatible env vars internally
        os.environ["OPENAI_API_KEY"] = THESYS_API_KEY
        os.environ["OPENAI_API_BASE"] = THESYS_BASE_URL

        # Create the model adapter with custom component metadata
        model = LiteLlm(
            model=THESYS_MODEL,
            metadata=THESYS_CUSTOM_COMPONENT_METADATA,
        )

        # Build the ADK agent with system instructions and tools
        self.agent = LlmAgent(
            name="travel_planner",
            model=model,
            instruction=SYSTEM_PROMPT,
            tools=[search_flights, search_hotels, build_daily_itinerary, summarize_trip_plan],
        )

        # In-memory session store — each thread_id gets its own conversation context
        self.session_service = InMemorySessionService()

        # The Runner executes the agent for each incoming request
        self.runner = Runner(
            app_name=APP_NAME,
            agent=self.agent,
            session_service=self.session_service,
        )

    async def process_message(
        self, thread_id: str, user_message: str
    ) -> AsyncGenerator[str, None]:
        """Stream SSE response chunks for a user message."""
        content = Content(role="user", parts=[Part(text=user_message)])

        # Reuse existing session or create a new one
        session = await self.session_service.get_session(
            app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=thread_id
        )
        if not session:
            session = await self.session_service.create_session(
                app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=thread_id
            )

        run_config = RunConfig(
            streaming_mode=StreamingMode.SSE,
            response_modalities=["TEXT"],
        )

        # Execute agent and yield text chunks as they arrive
        async for event in self.runner.run_async(
            user_id=DEFAULT_USER_ID,
            session_id=session.id,
            new_message=content,
            run_config=run_config,
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        yield part.text


# Singleton — initialized once at module load
travel_planner_agent = TravelPlannerAgent()
```

Key concepts:

- **`LiteLlm`** wraps the Thesys model in an OpenAI-compatible adapter so ADK can call it
- **`LlmAgent`** is ADK's core agent class — it takes a model, system instructions, and a list of tools
- **`InMemorySessionService`** stores conversation history per `thread_id` (swap for Firestore/Redis in production)
- **`Runner`** orchestrates the agent execution loop: user message → tool calls → model response → SSE stream

Also create `backend/__init__.py`:

```python
from .agent import travel_planner_agent

__all__ = ["travel_planner_agent"]
```

## Step 6: FastAPI Server (`main.py`)

The server exposes a single `/api/chat` endpoint that the frontend's `C1Chat` component calls directly.

```python
"""FastAPI Server for the Travel Planner."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn

from agent import travel_planner_agent
from config import PORT, FRONTEND_URL


class ChatMessage(BaseModel):
    role: str
    content: str
    id: Optional[str] = None


class ChatRequest(BaseModel):
    prompt: ChatMessage       # current user message
    threadId: str             # session/conversation identifier
    responseId: Optional[str] = None


app = FastAPI(
    title="Travel Planner API",
    description="Multi-agent travel planner powered by Google ADK + Thesys C1",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Travel Planner API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Stream SSE responses from the travel planner agent."""
    try:
        return StreamingResponse(
            travel_planner_agent.process_message(
                thread_id=request.threadId,
                user_message=request.prompt.content,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        )
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print(f"Starting Travel Planner server on port {PORT}")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, log_level="info")
```

The Pydantic models (`ChatMessage`, `ChatRequest`) must match the exact shape that `C1Chat` sends. The `no-cache, no-transform` headers prevent proxies from buffering the SSE stream.

## Step 7: Frontend Layout (`layout.tsx`)

```tsx
import type { Metadata } from "next";
import "@crayonai/react-ui/styles/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "ADK + Thesys travel planner assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Import `@crayonai/react-ui/styles/index.css` for base C1Chat styling, then your own `globals.css` for custom component styles.

## Step 8: Main Page (`page.tsx`)

The entire page is just a `C1Chat` component with custom components registered:

```tsx
"use client";

import { C1Chat } from "@thesysai/genui-sdk";
import {
  BudgetBreakdown,
  FlightList,
  HotelCardGrid,
  ItineraryTimeline,
} from "./components";

export default function HomePage() {
  return (
    <main>
      <C1Chat
        apiUrl="http://127.0.0.1:8000/api/chat"
        formFactor="full-page"
        agentName="Travel Planner"
        theme={{ mode: "dark" }}
        customizeC1={{
          customComponents: {
            FlightList,
            HotelCardGrid,
            ItineraryTimeline,
            BudgetBreakdown,
          },
        }}
      />
    </main>
  );
}
```

The keys in `customComponents` — `FlightList`, `HotelCardGrid`, etc. — **must match exactly** the keys in `CUSTOM_COMPONENT_SCHEMAS` from the backend. When the model outputs a component payload with name `FlightList`, C1Chat looks up and renders the corresponding React component.

## Step 9: Custom React Components (`components.tsx`)

This is the most code-heavy file. It contains four components and a trigger protocol for sending user actions back to the agent.

### The trigger protocol

When a user clicks a button (e.g., "Choose flight"), the component sends a machine-readable `COMPONENT_TRIGGER` message back to the agent:

```tsx
"use client";

import { useC1State, useOnAction } from "@thesysai/genui-sdk";

type TriggerPayload = Record<string, unknown>;
type OnActionFn = ReturnType<typeof useOnAction>;

function fireTrigger(
  onAction: OnActionFn,
  action: string,
  payload: TriggerPayload,
  humanMessage: string
) {
  const serializedPayload = JSON.stringify({
    source: "travel_custom_component",
    action,
    payload,
  });

  onAction(
    humanMessage,
    [
      `COMPONENT_TRIGGER ${serializedPayload}`,
      "Treat this as an explicit user action from the UI.",
      "Use tools as needed and respond with updated travel recommendations using custom components.",
    ].join("\n")
  );
}
```

`fireTrigger` sends two things: a human-visible message (e.g., "Select flight") and a hidden instruction block containing the structured JSON. The backend system prompt tells the model how to parse `COMPONENT_TRIGGER` lines.

### Shared selection state

Use `useC1State` to track which flight and hotel the user has selected across all components:

```tsx
function useSelections() {
  const { getValue: getSelectedFlightId } = useC1State("selected_flight_id");
  const { getValue: getSelectedHotelId } = useC1State("selected_hotel_id");
  const selectedFlightId = getSelectedFlightId() as string | undefined;
  const selectedHotelId = getSelectedHotelId() as string | undefined;

  return {
    selectedFlightId,
    selectedHotelId,
    hasBothSelections: Boolean(selectedFlightId && selectedHotelId),
  };
}
```

### FlightList and HotelCardGrid

These components render selectable cards. When a user clicks "Choose flight", two things happen:

1. **Local state update** via `setValue(flight.flight_id)` — provides instant UI feedback (the card highlights)
2. **Agent trigger** via `fireTrigger(onAction, "select_flight", ...)` — tells the agent which flight was chosen

The same pattern applies to `HotelCardGrid`.

### ItineraryTimeline and BudgetBreakdown (gated components)

These components use the `useSelections()` hook and **refuse to render** until both a flight and hotel are selected:

```tsx
const { hasBothSelections } = useSelections();

if (!hasBothSelections) {
  return (
    <section className="custom-card-stack">
      <div className="selection-gate">
        <p>Select your recommended flight and hotel first.</p>
      </div>
    </section>
  );
}
```

This enforces the staged flow defined in the system prompt. Even if the model tries to render an itinerary early, the frontend won't display it until the user has made selections.

The full `components.tsx` file includes these trigger actions:

| Component | Actions |
|-----------|---------|
| `FlightList` | `select_flight`, `compare_flights` |
| `HotelCardGrid` | `select_hotel`, `compare_hotels` |
| `ItineraryTimeline` | `refine_itinerary_day`, `regenerate_itinerary` |
| `BudgetBreakdown` | `optimize_budget`, `finalize_plan_with_selections` |

> See the full component implementations in [`components.tsx`](file:///Applications/Projects/Demos/theysis/travel-planner/frontend/app/components.tsx).

## Step 10: Styling (`globals.css`)

The CSS provides a warm, neutral-toned design with card-based layouts, timeline dots, and budget progress bars:

```css
:root {
  --background: #f4efe6;
  --foreground: #1f2421;
}

* { box-sizing: border-box; }

html, body {
  margin: 0; padding: 0; min-height: 100%;
  background: radial-gradient(circle at top left, #fff8ef, #efe4d4);
  color: var(--foreground);
  font-family: "IBM Plex Sans", "Avenir Next", sans-serif;
}

main { min-height: 100dvh; }

/* Card containers */
.custom-card-stack {
  display: grid; gap: 0.75rem; padding: 0.75rem;
  border: 1px solid #d6c8b5; border-radius: 12px; background: #fff8ee;
}

.custom-card {
  padding: 0.7rem; border: 1px solid #dacdbb;
  border-radius: 10px; background: #ffffff;
}

.custom-card.is-selected {
  border-color: #1f2421;
  box-shadow: 0 0 0 1px #1f2421 inset;
}

/* Grid layout for hotel cards */
.custom-grid {
  display: grid; gap: 0.6rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

/* Timeline */
.timeline-dot {
  width: 10px; height: 10px; border-radius: 999px;
  background: #3a6a6a; margin-top: 0.55rem;
}

.timeline-content {
  border-left: 2px solid #ded2c1; padding-left: 0.7rem;
}

/* Budget progress bars */
.budget-bar-track {
  width: 100%; height: 8px; border-radius: 999px;
  background: #e8dfd2; overflow: hidden;
}

.budget-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3a6a6a, #1f2421);
}

/* Selection gate (locked state) */
.selection-gate {
  border: 1px dashed #c6b49e; border-radius: 10px;
  padding: 0.75rem; background: #fff3e4;
}
```

> See the full stylesheet in [`globals.css`](file:///Applications/Projects/Demos/theysis/travel-planner/frontend/app/globals.css).

## Step 11: Run the Full Stack

### Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running: `curl http://localhost:8000/health` → `{"status":"healthy"}`

### Start the frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

### Try it out

Send a message like:

> *"Plan a 5-day trip from New York to Tokyo for 2 travelers"*

The agent will:

1. Call `search_flights` and `search_hotels` tools
2. Render a **FlightList** and **HotelCardGrid** with interactive cards
3. Wait for you to select a flight and hotel
4. After both selections, call `build_daily_itinerary` and `summarize_trip_plan`
5. Render an **ItineraryTimeline** and **BudgetBreakdown**
6. Let you refine individual days, regenerate the itinerary, optimize costs, or finalize the plan

## Architecture Summary

```
┌─────────────────────────┐     POST /api/chat     ┌───────────────────────────┐
│       Next.js Frontend  │ ──────────────────────► │    FastAPI Backend        │
│                         │                         │                          │
│  C1Chat ──► Components  │ ◄─── SSE text stream ── │  Runner ──► LlmAgent     │
│  - FlightList           │                         │  - search_flights        │
│  - HotelCardGrid        │                         │  - search_hotels         │
│  - ItineraryTimeline    │                         │  - build_daily_itinerary │
│  - BudgetBreakdown      │                         │  - summarize_trip_plan   │
│                         │                         │                          │
│  useC1State (selections)│                         │  InMemorySessionService  │
│  useOnAction (triggers) │                         │  LiteLlm + Thesys C1    │
└─────────────────────────┘                         └───────────────────────────┘
```

## Next Steps

To take this from demo to production:

- **Real APIs** — Replace mock tools with calls to Amadeus, Booking.com, Google Places, etc.
- **Persistent sessions** — Swap `InMemorySessionService` for Firestore, Redis, or a database-backed session store
- **Authentication** — Add user auth (e.g., Clerk) and pass `user_id` to the agent
- **Multi-agent architecture** — Split into specialized sub-agents (flight expert, hotel expert, itinerary planner) using ADK's agent composition
- **Deployment** — Deploy the backend to Cloud Run or Railway, and the frontend to Vercel
