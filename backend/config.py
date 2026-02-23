"""Configuration for the Travel Planner backend."""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

THESYS_API_KEY = os.getenv("THESYS_API_KEY", "")
THESYS_BASE_URL = os.getenv("THESYS_BASE_URL", "https://api.thesys.dev/v1/embed")
THESYS_MODEL = os.getenv(
    "THESYS_MODEL", "c1/openai/anthropic/claude-sonnet-4/v-20251230"
)

APP_NAME = os.getenv("APP_NAME", "travel_planner")
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "demo_user")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PORT = int(os.getenv("PORT", "8000"))
