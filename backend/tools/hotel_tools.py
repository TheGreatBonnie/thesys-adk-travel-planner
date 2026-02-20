"""Hotel search tools for the Travel Planner agent."""

from __future__ import annotations

import hashlib
from typing import Any


def _stable_int(seed: str, low: int, high: int) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    value = int(digest[8:16], 16)
    return low + (value % (high - low + 1))


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
            }
        )

    return sorted(results, key=lambda item: (item["nightly_rate_usd"], -item["star_rating"]))
