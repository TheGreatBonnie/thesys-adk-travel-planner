"""
FastAPI Server for the Travel Planner — Google ADK + Thesys C1 Integration.
Request/response shape matches exactly what the C1Chat component sends,
mirroring the pattern from the reference AssistantAgent implementation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn

from agent import travel_planner_agent
from config import PORT, FRONTEND_URL


# --------------------------------------------------------------------------- #
# Request Models — must match the exact shape C1Chat sends                    #
# --------------------------------------------------------------------------- #

class ChatMessage(BaseModel):
    role: str
    content: str
    id: Optional[str] = None


class ChatRequest(BaseModel):
    prompt: ChatMessage       # current user message
    threadId: str             # session/conversation identifier
    responseId: Optional[str] = None


# --------------------------------------------------------------------------- #
# App                                                                          #
# --------------------------------------------------------------------------- #

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


# --------------------------------------------------------------------------- #
# Routes                                                                       #
# --------------------------------------------------------------------------- #

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Travel Planner API is running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint compatible with the C1Chat component.
    Streams SSE responses from the multi-agent travel planner.
    The C1Chat component on the frontend interprets this stream and renders
    interactive UI: flight cards, hotel cards, itinerary timeline, budget chart.
    """
    try:
        return StreamingResponse(
            travel_planner_agent.process_message(
                thread_id=request.threadId,
                user_message=request.prompt.content,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",  # no-transform prevents proxy buffering
                "Connection": "keep-alive",
            },
        )
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print(f"Starting Travel Planner server on port {PORT}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"API available at: http://localhost:{PORT}/api/chat")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, log_level="info")