"""Schemas for frontend Thesys custom components."""

from __future__ import annotations

import json
from typing import Any


def _obj(description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {
        "type": "object",
        "description": description,
        "properties": properties,
        "required": required,
        "additionalProperties": False,
    }


FLIGHT_SCHEMA: dict[str, Any] = _obj(
    "Represents a single flight option for a route and date.",
    properties={
        "flight_id": {"type": "string", "description": "Unique flight identifier."},
        "airline": {"type": "string", "description": "Airline name."},
        "origin": {"type": "string", "description": "Departure airport or city."},
        "destination": {"type": "string", "description": "Arrival airport or city."},
        "departure_date": {
            "type": "string",
            "description": "Departure date in YYYY-MM-DD format.",
        },
        "departure_time_local": {
            "type": "string",
            "description": "Local departure time HH:MM.",
        },
        "duration_hours": {
            "type": "number",
            "description": "Total flight duration in hours.",
        },
        "stops": {"type": "integer", "description": "Number of stops."},
        "cabin_class": {"type": "string", "description": "Cabin class."},
        "total_price_usd": {
            "type": "number",
            "description": "Total price in USD for all travelers.",
        },
        "image_url": {
            "type": "string",
            "description": "Optional preview image URL for the flight card.",
        },
    },
    required=[
        "flight_id",
        "airline",
        "origin",
        "destination",
        "departure_date",
        "departure_time_local",
        "duration_hours",
        "stops",
        "cabin_class",
        "total_price_usd",
    ],
)

HOTEL_SCHEMA: dict[str, Any] = _obj(
    "Represents a hotel option including nightly rate and trip dates.",
    properties={
        "hotel_id": {"type": "string", "description": "Unique hotel identifier."},
        "name": {"type": "string", "description": "Hotel name."},
        "city": {"type": "string", "description": "City where hotel is located."},
        "check_in_date": {
            "type": "string",
            "description": "Check-in date in YYYY-MM-DD format.",
        },
        "check_out_date": {
            "type": "string",
            "description": "Check-out date in YYYY-MM-DD format.",
        },
        "guests": {"type": "integer", "description": "Number of guests."},
        "rooms": {"type": "integer", "description": "Number of rooms."},
        "nightly_rate_usd": {
            "type": "number",
            "description": "Nightly price in USD.",
        },
        "star_rating": {"type": "number", "description": "Star rating, e.g. 4.5."},
        "walkability_score": {
            "type": "integer",
            "description": "Walkability score from 0 to 100.",
        },
        "amenities": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of included amenities.",
        },
        "image_url": {
            "type": "string",
            "description": "Optional preview image URL for the hotel card.",
        },
    },
    required=[
        "hotel_id",
        "name",
        "city",
        "check_in_date",
        "check_out_date",
        "guests",
        "rooms",
        "nightly_rate_usd",
        "star_rating",
        "walkability_score",
        "amenities",
    ],
)

ITINERARY_DAY_SCHEMA: dict[str, Any] = _obj(
    "Represents one day in the itinerary timeline.",
    properties={
        "date": {"type": "string", "description": "Date in YYYY-MM-DD format."},
        "pace": {"type": "string", "description": "Travel pace for the day."},
        "activities": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Planned activities for the day.",
        },
        "image_url": {
            "type": "string",
            "description": "Optional cover image URL for the itinerary day.",
        },
    },
    required=["date", "pace", "activities"],
)

BUDGET_BREAKDOWN_SCHEMA: dict[str, Any] = _obj(
    "Trip cost estimate in USD broken down by category.",
    properties={
        "flight": {"type": "number", "description": "Estimated flight total in USD."},
        "hotel": {"type": "number", "description": "Estimated hotel total in USD."},
        "food_and_local_transport": {
            "type": "number",
            "description": "Estimated food and local transport total in USD.",
        },
        "total_estimate": {
            "type": "number",
            "description": "Overall trip estimate in USD.",
        },
    },
    required=["flight", "hotel", "food_and_local_transport", "total_estimate"],
)

CUSTOM_COMPONENT_SCHEMAS: dict[str, Any] = {
    "FlightList": _obj(
        "Displays multiple flight options in an interactive selectable list.",
        properties={
            "title": {
                "type": "string",
                "description": "Optional title shown above flight cards.",
            },
            "flights": {
                "type": "array",
                "items": FLIGHT_SCHEMA,
                "description": "List of flight options.",
            },
        },
        required=["flights"],
    ),
    "HotelCardGrid": _obj(
        "Displays hotel options in a selectable card grid.",
        properties={
            "title": {
                "type": "string",
                "description": "Optional title shown above hotel cards.",
            },
            "hotels": {
                "type": "array",
                "items": HOTEL_SCHEMA,
                "description": "List of hotel options.",
            },
        },
        required=["hotels"],
    ),
    "ItineraryTimeline": _obj(
        "Displays a day-by-day itinerary timeline with activities.",
        properties={
            "title": {
                "type": "string",
                "description": "Optional section title.",
            },
            "days": {
                "type": "array",
                "items": ITINERARY_DAY_SCHEMA,
                "description": "Ordered itinerary days.",
            },
        },
        required=["days"],
    ),
    "BudgetBreakdown": _obj(
        "Displays a visual budget summary for trip costs.",
        properties={
            "title": {
                "type": "string",
                "description": "Optional section title.",
            },
            "estimated_cost_breakdown_usd": BUDGET_BREAKDOWN_SCHEMA,
        },
        required=["estimated_cost_breakdown_usd"],
    ),
}

THESYS_CUSTOM_COMPONENT_METADATA: dict[str, str] = {
    "thesys": json.dumps({"c1_custom_components": CUSTOM_COMPONENT_SCHEMAS})
}
