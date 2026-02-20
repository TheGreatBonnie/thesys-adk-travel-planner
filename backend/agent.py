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
    APP_NAME,
    DEFAULT_USER_ID,
    SYSTEM_PROMPT,
    THESYS_API_KEY,
    THESYS_BASE_URL,
    THESYS_MODEL,
)
from tools import build_daily_itinerary, search_flights, search_hotels, summarize_trip_plan


class TravelPlannerAgent:
    """ADK-backed travel planner with tool-calling support."""

    def __init__(self) -> None:
        if not THESYS_API_KEY:
            raise ValueError("THESYS_API_KEY is required. Set it in backend/.env")

        # LiteLLM inside ADK reads OpenAI-compatible variables.
        os.environ["OPENAI_API_KEY"] = THESYS_API_KEY
        os.environ["OPENAI_API_BASE"] = THESYS_BASE_URL

        model = LiteLlm(model=THESYS_MODEL)

        self.agent = LlmAgent(
            name="travel_planner",
            model=model,
            instruction=SYSTEM_PROMPT,
            tools=[
                search_flights,
                search_hotels,
                build_daily_itinerary,
                summarize_trip_plan,
            ],
        )
        self.session_service = InMemorySessionService()
        self.runner = Runner(
            app_name=APP_NAME,
            agent=self.agent,
            session_service=self.session_service,
        )

    async def process_message(
        self, thread_id: str, user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        Process a user message and stream the response as SSE chunks.
        Identical contract to AssistantAgent.process_message — the C1Chat
        component consumes this stream and renders interactive UI from it.

        Args:
            thread_id:    Unique conversation identifier (from C1Chat's threadId).
            user_message: The user's raw message content.

        Yields:
            SSE text chunks from the Thesys C1 model.
        """
        content = Content(role="user", parts=[Part(text=user_message)])

        # Retrieve existing session or create a new one for this thread
        session = await self.session_service.get_session(
            app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=thread_id
        )
        if not session:
            session = await self.session_service.create_session(
                app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=thread_id
            )

        # SSE streaming mode — chunks arrive in real time as C1 generates UI
        run_config = RunConfig(
            streaming_mode=StreamingMode.SSE,
            response_modalities=["TEXT"],
        )

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


travel_planner_agent = TravelPlannerAgent()
