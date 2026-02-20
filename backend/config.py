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
""".strip()
