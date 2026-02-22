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
from custom_components import THESYS_CUSTOM_COMPONENT_METADATA
from tools import build_daily_itinerary, search_flights, search_hotels, summarize_trip_plan


class TravelPlannerAgent:
    """ADK-backed travel planner with tool-calling support."""

    def __init__(self) -> None:
        # Step 1: Fail fast if credentials are missing.
        if not THESYS_API_KEY:
            raise ValueError("THESYS_API_KEY is required. Set it in backend/.env")

        # Step 2: Expose Thesys credentials in OpenAI-compatible env vars
        # because ADK's LiteLLM adapter reads these names internally.
        os.environ["OPENAI_API_KEY"] = THESYS_API_KEY
        os.environ["OPENAI_API_BASE"] = THESYS_BASE_URL

        # Step 3: Create the model adapter and attach custom component metadata
        # so the model can return payloads that map to frontend components.
        model = LiteLlm(
            model=THESYS_MODEL,
            metadata=THESYS_CUSTOM_COMPONENT_METADATA,
        )

        # Step 4: Build the ADK agent with system instructions and tool set.
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

        # Step 5: Initialize an in-memory session store so each thread id
        # can maintain its own conversational context.
        self.session_service = InMemorySessionService()

        # Step 6: Create the ADK runner that executes the agent for each request.
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
        # Step 1: Convert raw user text into ADK's structured Content format.
        content = Content(role="user", parts=[Part(text=user_message)])

        # Step 2: Reuse an existing session for this thread when possible.
        session = await self.session_service.get_session(
            app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=thread_id
        )

        # Step 3: If no session exists yet, create one so context persists
        # across subsequent messages for the same thread id.
        if not session:
            session = await self.session_service.create_session(
                app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=thread_id
            )

        # Step 4: Request SSE streaming so the frontend receives incremental
        # response chunks instead of waiting for a full response.
        run_config = RunConfig(
            streaming_mode=StreamingMode.SSE,
            response_modalities=["TEXT"],
        )

        # Step 5: Execute the agent run and stream each textual part as it arrives.
        async for event in self.runner.run_async(
            user_id=DEFAULT_USER_ID,
            session_id=session.id,
            new_message=content,
            run_config=run_config,
        ):
            # Step 6: Guard against non-text events and yield only text chunks
            # expected by the frontend SSE consumer.
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        yield part.text


travel_planner_agent = TravelPlannerAgent()
