"""Flight search tools for the Travel Planner agent."""

from __future__ import annotations

import hashlib
from typing import Any


def _stable_int(seed: str, low: int, high: int) -> int:
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
