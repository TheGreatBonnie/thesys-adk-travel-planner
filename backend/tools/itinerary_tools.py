"""Itinerary planning tools for the Travel Planner agent."""

from __future__ import annotations

from datetime import date, timedelta
import hashlib
from typing import Any


def _mock_image_url(seed: str, width: int = 960, height: int = 540) -> str:
    """Return a deterministic image URL for itinerary day cards."""
    # Step 1: Hash the seed so each itinerary day maps to a stable image.
    safe_seed = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    # Step 2: Build deterministic preview image URLs for timeline cards.
    return f"https://picsum.photos/seed/{safe_seed}/{width}/{height}"


def build_daily_itinerary(
    destination: str,
    start_date: str,
    end_date: str,
    interests: list[str] | None = None,
    pace: str = "balanced",
) -> list[dict[str, Any]]:
    """Create a day-by-day itinerary skeleton with activities."""
    # Step 1: Provide default interests when the caller does not specify any.
    interests = interests or ["food", "landmarks", "local culture"]

    # Step 2: Parse the incoming ISO date strings.
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    # Step 3: Guard against invalid date windows.
    if end < start:
        raise ValueError("end_date must be on or after start_date")

    # Step 4: Define reusable activity pools by interest category.
    activity_bank = {
        "food": ["street food tour", "chef tasting menu", "local market crawl"],
        "nature": ["sunrise viewpoint", "city park walk", "coastal trail"],
        "landmarks": ["historic district", "architecture walk", "museum visit"],
        "shopping": ["artisan market", "design district", "bookstore crawl"],
        "local culture": ["neighborhood walk", "live music venue", "cultural center"],
    }

    # Step 5: Compute schedule size and activity density from date range + pace.
    schedule: list[dict[str, Any]] = []
    day_count = (end - start).days + 1
    slots_per_day = 2 if pace == "slow" else 4 if pace == "fast" else 3

    # Step 6: Build each day and select activities in a deterministic rotation.
    for offset in range(day_count):
        current = start + timedelta(days=offset)
        picks: list[str] = []
        for slot in range(slots_per_day):
            interest = interests[(offset + slot) % len(interests)]
            choices = activity_bank.get(interest, activity_bank["local culture"])
            picks.append(f"{destination}: {choices[(offset + slot) % len(choices)]}")

        # Step 7: Emit frontend-compatible timeline data for this day.
        schedule.append(
            {
                "date": current.isoformat(),
                "pace": pace,
                "activities": picks,
                "image_url": _mock_image_url(f"{destination}-{current.isoformat()}-{pace}"),
            }
        )

    # Step 8: Return the full timeline in chronological order.
    return schedule


def summarize_trip_plan(
    flights: list[dict[str, Any]],
    hotels: list[dict[str, Any]],
    itinerary: list[dict[str, Any]],
    travelers: int = 1,
) -> dict[str, Any]:
    """Build a high-level trip summary and cost estimate."""
    # Step 1: Treat the first option in each list as the recommended choice.
    best_flight = flights[0] if flights else None
    best_hotel = hotels[0] if hotels else None

    # Step 2: Estimate line items from recommendations and itinerary length.
    nights = max(0, len(itinerary) - 1)
    flight_cost = int(best_flight["total_price_usd"]) if best_flight else 0
    hotel_cost = int(best_hotel["nightly_rate_usd"]) * nights if best_hotel else 0
    food_local = 65 * max(1, len(itinerary)) * max(1, travelers)

    # Step 3: Return a structured summary used by the budget component.
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
