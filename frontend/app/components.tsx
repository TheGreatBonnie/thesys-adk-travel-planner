"use client";

import { useC1State, useOnAction } from "@thesysai/genui-sdk";

type Flight = {
  flight_id: string;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time_local: string;
  duration_hours: number;
  stops: number;
  cabin_class: string;
  total_price_usd: number;
};

type Hotel = {
  hotel_id: string;
  name: string;
  city: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  rooms: number;
  nightly_rate_usd: number;
  star_rating: number;
  walkability_score: number;
  amenities: string[];
};

type ItineraryDay = {
  date: string;
  pace: string;
  activities: string[];
};

type CostBreakdown = {
  flight: number;
  hotel: number;
  food_and_local_transport: number;
  total_estimate: number;
};

export function FlightList({
  flights,
  title = "Flight Options",
}: {
  flights: Flight[];
  title?: string;
}) {
  const onAction = useOnAction();
  const { getValue, setValue } = useC1State("selected_flight_id");
  const selectedFlightId = getValue() as string | undefined;

  return (
    <section className="custom-card-stack">
      <header className="custom-header-row">
        <h3>{title}</h3>
        <span>{flights.length} results</span>
      </header>
      <div className="custom-list">
        {flights.map((flight) => {
          const isSelected = selectedFlightId === flight.flight_id;
          return (
            <article
              key={flight.flight_id}
              className={`custom-card ${isSelected ? "is-selected" : ""}`}
            >
              <div className="custom-card-top">
                <strong>{flight.airline}</strong>
                <span>${flight.total_price_usd.toLocaleString()}</span>
              </div>
              <p>
                {flight.origin} → {flight.destination}
              </p>
              <p>
                {flight.departure_date} at {flight.departure_time_local} • {flight.duration_hours}h • {flight.stops} stop(s) • {flight.cabin_class}
              </p>
              <button
                type="button"
                onClick={() => {
                  setValue(flight.flight_id);
                  onAction(
                    "Select Flight",
                    `User selected flight ${flight.flight_id} with ${flight.airline} from ${flight.origin} to ${flight.destination} for $${flight.total_price_usd}.`
                  );
                }}
              >
                {isSelected ? "Selected" : "Choose flight"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HotelCardGrid({
  hotels,
  title = "Hotel Options",
}: {
  hotels: Hotel[];
  title?: string;
}) {
  const onAction = useOnAction();
  const { getValue, setValue } = useC1State("selected_hotel_id");
  const selectedHotelId = getValue() as string | undefined;

  return (
    <section className="custom-card-stack">
      <header className="custom-header-row">
        <h3>{title}</h3>
        <span>{hotels.length} results</span>
      </header>
      <div className="custom-grid">
        {hotels.map((hotel) => {
          const isSelected = selectedHotelId === hotel.hotel_id;
          return (
            <article
              key={hotel.hotel_id}
              className={`custom-card ${isSelected ? "is-selected" : ""}`}
            >
              <div className="custom-card-top">
                <strong>{hotel.name}</strong>
                <span>${hotel.nightly_rate_usd}/night</span>
              </div>
              <p>
                {hotel.city} • {hotel.star_rating.toFixed(1)}★ • Walkability {hotel.walkability_score}
              </p>
              <p>
                {hotel.check_in_date} → {hotel.check_out_date} • {hotel.guests} guest(s) • {hotel.rooms} room(s)
              </p>
              <p>{hotel.amenities.join(" • ")}</p>
              <button
                type="button"
                onClick={() => {
                  setValue(hotel.hotel_id);
                  onAction(
                    "Select Hotel",
                    `User selected hotel ${hotel.hotel_id} (${hotel.name}) in ${hotel.city} at $${hotel.nightly_rate_usd} per night.`
                  );
                }}
              >
                {isSelected ? "Selected" : "Choose hotel"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ItineraryTimeline({
  days,
  title = "Daily Itinerary",
}: {
  days: ItineraryDay[];
  title?: string;
}) {
  const onAction = useOnAction();

  return (
    <section className="custom-card-stack">
      <header className="custom-header-row">
        <h3>{title}</h3>
        <span>{days.length} day plan</span>
      </header>
      <ol className="timeline-list">
        {days.map((day) => (
          <li key={day.date} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="custom-card-top">
                <strong>{day.date}</strong>
                <span>{day.pace}</span>
              </div>
              <ul>
                {day.activities.map((activity, index) => (
                  <li key={`${day.date}-${index}`}>{activity}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  onAction(
                    "Refine day",
                    `User requested refinements for itinerary day ${day.date} with pace ${day.pace}.`
                  )
                }
              >
                Refine this day
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function BudgetBreakdown({
  estimated_cost_breakdown_usd,
  title = "Budget Breakdown",
}: {
  estimated_cost_breakdown_usd: CostBreakdown;
  title?: string;
}) {
  const onAction = useOnAction();
  const total = estimated_cost_breakdown_usd.total_estimate || 0;

  const rows = [
    { label: "Flight", value: estimated_cost_breakdown_usd.flight || 0 },
    { label: "Hotel", value: estimated_cost_breakdown_usd.hotel || 0 },
    {
      label: "Food + local transport",
      value: estimated_cost_breakdown_usd.food_and_local_transport || 0,
    },
  ];

  return (
    <section className="custom-card-stack">
      <header className="custom-header-row">
        <h3>{title}</h3>
        <strong>${total.toLocaleString()}</strong>
      </header>
      <div className="custom-list">
        {rows.map((row) => {
          const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
          return (
            <div key={row.label} className="budget-row">
              <div className="custom-card-top">
                <span>{row.label}</span>
                <span>
                  ${row.value.toLocaleString()} ({pct}%)
                </span>
              </div>
              <div className="budget-bar-track">
                <div className="budget-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          onAction(
            "Adjust budget",
            `User wants to adjust the budget. Current estimate is $${total}.`
          )
        }
      >
        Optimize cost
      </button>
    </section>
  );
}
