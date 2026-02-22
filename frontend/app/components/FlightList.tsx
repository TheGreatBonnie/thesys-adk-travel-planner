"use client";

import { useC1State, useOnAction } from "@thesysai/genui-sdk";

import type { Flight } from "../types";
import { fireTrigger } from "../triggers";
import { CardImage } from "./CardImage";

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
              <CardImage
                src={flight.image_url}
                alt={`${flight.airline} flight ${flight.flight_id}`}
              />
              <div className="custom-card-top">
                <strong>{flight.airline}</strong>
                <span>${flight.total_price_usd.toLocaleString()}</span>
              </div>
              <p>
                {flight.origin} → {flight.destination}
              </p>
              <p>
                {flight.departure_date} at {flight.departure_time_local} •{" "}
                {flight.duration_hours}h • {flight.stops} stop(s) •{" "}
                {flight.cabin_class}
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
