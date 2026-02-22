"""Flight search tools for the Travel Planner agent."""

from __future__ import annotations

import hashlib
from typing import Any


def _stable_int(seed: str, low: int, high: int) -> int:
    # Step 1: Hash the seed so repeated inputs always produce the same output.
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    # Step 2: Convert part of the hash into an integer.
    value = int(digest[:8], 16)
    # Step 3: Map the integer into the requested inclusive range.
    return low + (value % (high - low + 1))


def _mock_image_url(seed: str, width: int = 720, height: int = 420) -> str:
    """Return a deterministic image URL for mock cards."""
    # Step 1: Derive a stable, URL-safe seed from the input.
    safe_seed = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    # Step 2: Build a deterministic Picsum URL for consistent card previews.
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
    # Step 1: Define a fixed airline list so the tool returns predictable options.
    airlines = ["SkyJet", "Atlas Air", "Horizon Lines"]
    # Step 2: Prepare a container for generated flight options.
    options: list[dict[str, Any]] = []

    # Step 3: Build one deterministic option per airline.
    for idx, airline in enumerate(airlines, start=1):
        seed = f"{origin}-{destination}-{departure_date}-{airline}-{cabin_class}"

        # Step 4: Compute stable attributes from the seed so outputs are repeatable.
        base_price = _stable_int(seed, 180, 820)
        duration_h = _stable_int(seed + "-duration", 2, 14)
        stops = _stable_int(seed + "-stops", 0, 2)
        depart_hour = _stable_int(seed + "-depart", 5, 21)
        price = base_price * max(1, travelers)

        # Step 5: Emit a schema-compatible flight object for the frontend card UI.
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

    # Step 6: Return lowest-price-first results to simplify recommendation logic.
    return sorted(options, key=lambda item: item["total_price_usd"])
