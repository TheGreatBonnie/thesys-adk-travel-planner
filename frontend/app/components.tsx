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

type TriggerPayload = Record<string, unknown>;
type OnActionFn = ReturnType<typeof useOnAction>;

function fireTrigger(
  onAction: OnActionFn,
  action: string,
  payload: TriggerPayload,
  humanMessage: string
) {
  const serializedPayload = JSON.stringify({
    source: "travel_custom_component",
    action,
    payload,
  });

  onAction(
    humanMessage,
    [
      `COMPONENT_TRIGGER ${serializedPayload}`,
      "Treat this as an explicit user action from the UI.",
      "Use tools as needed and respond with updated travel recommendations using custom components.",
    ].join("\n")
  );
}

function useSelections() {
  const { getValue: getSelectedFlightId } = useC1State("selected_flight_id");
  const { getValue: getSelectedHotelId } = useC1State("selected_hotel_id");
  const selectedFlightId = getSelectedFlightId() as string | undefined;
  const selectedHotelId = getSelectedHotelId() as string | undefined;

  return {
    selectedFlightId,
    selectedHotelId,
    hasBothSelections: Boolean(selectedFlightId && selectedHotelId),
  };
}

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
        <div className="custom-header-actions">
          <span>{flights.length} results</span>
          <button
            type="button"
            className="trigger-link-button"
            onClick={() =>
              fireTrigger(
                onAction,
                "compare_flights",
                {
                  flights: flights.map((flight) => ({
                    flight_id: flight.flight_id,
                    airline: flight.airline,
                    total_price_usd: flight.total_price_usd,
                    stops: flight.stops,
                    duration_hours: flight.duration_hours,
                  })),
                },
                "Compare flights"
              )
            }
          >
            Compare
          </button>
        </div>
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
                  fireTrigger(
                    onAction,
                    "select_flight",
                    {
                      flight_id: flight.flight_id,
                      airline: flight.airline,
                      origin: flight.origin,
                      destination: flight.destination,
                      departure_date: flight.departure_date,
                      total_price_usd: flight.total_price_usd,
                    },
                    "Select flight"
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
        <div className="custom-header-actions">
          <span>{hotels.length} results</span>
          <button
            type="button"
            className="trigger-link-button"
            onClick={() =>
              fireTrigger(
                onAction,
                "compare_hotels",
                {
                  hotels: hotels.map((hotel) => ({
                    hotel_id: hotel.hotel_id,
                    name: hotel.name,
                    nightly_rate_usd: hotel.nightly_rate_usd,
                    star_rating: hotel.star_rating,
                    walkability_score: hotel.walkability_score,
                  })),
                },
                "Compare hotels"
              )
            }
          >
            Compare
          </button>
        </div>
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
                  fireTrigger(
                    onAction,
                    "select_hotel",
                    {
                      hotel_id: hotel.hotel_id,
                      name: hotel.name,
                      city: hotel.city,
                      check_in_date: hotel.check_in_date,
                      check_out_date: hotel.check_out_date,
                      nightly_rate_usd: hotel.nightly_rate_usd,
                    },
                    "Select hotel"
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
  const { selectedFlightId, selectedHotelId, hasBothSelections } = useSelections();

  if (!hasBothSelections) {
    return (
      <section className="custom-card-stack">
        <header className="custom-header-row">
          <h3>{title}</h3>
          <span>Locked until selections</span>
        </header>
        <div className="selection-gate">
          <p>Select your recommended flight and hotel first.</p>
          <p>
            Flight: {selectedFlightId ? "Selected" : "Not selected"} • Hotel:{" "}
            {selectedHotelId ? "Selected" : "Not selected"}
          </p>
        </div>
      </section>
    );
  }

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
                  fireTrigger(
                    onAction,
                    "refine_itinerary_day",
                    {
                      date: day.date,
                      pace: day.pace,
                      activities: day.activities,
                    },
                    "Refine this day"
                  )
                }
              >
                Refine this day
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() =>
          fireTrigger(
            onAction,
            "regenerate_itinerary",
            {
              days: days.map((day) => ({
                date: day.date,
                pace: day.pace,
              })),
            },
            "Regenerate itinerary"
          )
        }
      >
        Regenerate itinerary
      </button>
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
  const { selectedFlightId, selectedHotelId, hasBothSelections } = useSelections();
  const total = estimated_cost_breakdown_usd.total_estimate || 0;

  if (!hasBothSelections) {
    return (
      <section className="custom-card-stack">
        <header className="custom-header-row">
          <h3>{title}</h3>
          <span>Locked until selections</span>
        </header>
        <div className="selection-gate">
          <p>Budget appears after flight and hotel are selected.</p>
          <p>
            Flight: {selectedFlightId ? "Selected" : "Not selected"} • Hotel:{" "}
            {selectedHotelId ? "Selected" : "Not selected"}
          </p>
        </div>
      </section>
    );
  }

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
      <div className="custom-action-row">
        <button
          type="button"
          onClick={() =>
            fireTrigger(
              onAction,
              "optimize_budget",
              {
                estimated_cost_breakdown_usd,
              },
              "Optimize cost"
            )
          }
        >
          Optimize cost
        </button>
        <button
          type="button"
          disabled={!selectedFlightId || !selectedHotelId}
          onClick={() =>
            fireTrigger(
              onAction,
              "finalize_plan_with_selections",
              {
                selected_flight_id: selectedFlightId,
                selected_hotel_id: selectedHotelId,
                estimated_cost_breakdown_usd,
              },
              "Finalize plan"
            )
          }
        >
          Finalize with selections
        </button>
      </div>
    </section>
  );
}
