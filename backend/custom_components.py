"""Pydantic models and Thesys metadata for frontend custom components.

Each model defines both the runtime type and the JSON schema that gets
sent to the Thesys C1 model via metadata, telling it exactly what data
shape to produce when rendering a frontend component.
"""

from __future__ import annotations

import json
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Item models — one per entity rendered inside a component
# ---------------------------------------------------------------------------


class Flight(BaseModel):
    """Represents a single flight option for a route and date."""

    flight_id: str = Field(description="Unique flight identifier.")
    airline: str = Field(description="Airline name.")
    origin: str = Field(description="Departure airport or city.")
    destination: str = Field(description="Arrival airport or city.")
    departure_date: str = Field(description="Departure date in YYYY-MM-DD format.")
    departure_time_local: str = Field(description="Local departure time HH:MM.")
    duration_hours: float = Field(description="Total flight duration in hours.")
    stops: int = Field(description="Number of stops.")
    cabin_class: str = Field(description="Cabin class.")
    total_price_usd: float = Field(description="Total price in USD for all travelers.")
    image_url: Optional[str] = Field(default=None, description="Optional preview image URL for the flight card.")


class Hotel(BaseModel):
    """Represents a hotel option including nightly rate and trip dates."""

    hotel_id: str = Field(description="Unique hotel identifier.")
    name: str = Field(description="Hotel name.")
    city: str = Field(description="City where hotel is located.")
    check_in_date: str = Field(description="Check-in date in YYYY-MM-DD format.")
    check_out_date: str = Field(description="Check-out date in YYYY-MM-DD format.")
    guests: int = Field(description="Number of guests.")
    rooms: int = Field(description="Number of rooms.")
    nightly_rate_usd: float = Field(description="Nightly price in USD.")
    star_rating: float = Field(description="Star rating, e.g. 4.5.")
    walkability_score: int = Field(description="Walkability score from 0 to 100.")
    amenities: list[str] = Field(description="List of included amenities.")
    image_url: Optional[str] = Field(default=None, description="Optional preview image URL for the hotel card.")


class ItineraryDay(BaseModel):
    """Represents one day in the itinerary timeline."""

    date: str = Field(description="Date in YYYY-MM-DD format.")
    pace: str = Field(description="Travel pace for the day.")
    activities: list[str] = Field(description="Planned activities for the day.")
    image_url: Optional[str] = Field(default=None, description="Optional cover image URL for the itinerary day.")


class BudgetBreakdownData(BaseModel):
    """Trip cost estimate in USD broken down by category."""

    flight: float = Field(description="Estimated flight total in USD.")
    hotel: float = Field(description="Estimated hotel total in USD.")
    food_and_local_transport: float = Field(description="Estimated food and local transport total in USD.")
    total_estimate: float = Field(description="Overall trip estimate in USD.")


# ---------------------------------------------------------------------------
# Component models — one per frontend React component
# ---------------------------------------------------------------------------


class FlightListComponent(BaseModel):
    """Displays multiple flight options in an interactive selectable list."""

    title: Optional[str] = Field(default=None, description="Optional title shown above flight cards.")
    flights: list[Flight] = Field(description="List of flight options.")


class HotelCardGridComponent(BaseModel):
    """Displays hotel options in a selectable card grid."""

    title: Optional[str] = Field(default=None, description="Optional title shown above hotel cards.")
    hotels: list[Hotel] = Field(description="List of hotel options.")


class ItineraryTimelineComponent(BaseModel):
    """Displays a day-by-day itinerary timeline with activities."""

    title: Optional[str] = Field(default=None, description="Optional section title.")
    days: list[ItineraryDay] = Field(description="Ordered itinerary days.")


class BudgetBreakdownComponent(BaseModel):
    """Displays a visual budget summary for trip costs."""

    title: Optional[str] = Field(default=None, description="Optional section title.")
    estimated_cost_breakdown_usd: BudgetBreakdownData = Field(description="Cost breakdown by category.")


# ---------------------------------------------------------------------------
# Compose into Thesys metadata
# ---------------------------------------------------------------------------

CUSTOM_COMPONENT_SCHEMAS = {
    "FlightList": FlightListComponent.model_json_schema(),
    "HotelCardGrid": HotelCardGridComponent.model_json_schema(),
    "ItineraryTimeline": ItineraryTimelineComponent.model_json_schema(),
    "BudgetBreakdown": BudgetBreakdownComponent.model_json_schema(),
}

THESYS_CUSTOM_COMPONENT_METADATA: dict[str, str] = {
    "thesys": json.dumps({"c1_custom_components": CUSTOM_COMPONENT_SCHEMAS})
}
