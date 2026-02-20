import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000/api/chat";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const upstream = await fetch(BACKEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });

    if (!upstream.body) {
      console.error("Travel Planner proxy: upstream response missing body");
      return NextResponse.json(
        { error: "Backend returned an empty response body" },
        { status: 502 },
      );
    }

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error(
        `Travel Planner proxy: backend status ${upstream.status} - ${errorText}`,
      );
      return NextResponse.json(
        { error: "Backend request failed", details: errorText },
        { status: upstream.status },
      );
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not reach backend Travel Planner API";
    console.error(`Travel Planner proxy fetch failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
