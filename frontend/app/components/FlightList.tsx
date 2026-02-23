// Enable client-side rendering for this component
"use client";

// Step 1: Import hooks from the Thesys SDK for state management and action handling
import { useC1State, useOnAction } from "@thesysai/genui-sdk";

// Step 2: Import TypeScript types and utilities
import type { Flight } from "../types";
import { fireTrigger } from "../triggers";
import { CardImage } from "./CardImage";

// Step 3: Define the FlightList component that displays a list of flight options
// Props: flights array and optional title for the section
export function FlightList({
  flights,
  title = "Flight Options",
}: {
  flights: Flight[];
  title?: string;
}) {
  // Step 4: Initialize state management hooks
  // onAction: callback function to fire triggers for user interactions
  const onAction = useOnAction();
  // getValue/setValue: manage the currently selected flight ID in state
  const { getValue, setValue } = useC1State("selected_flight_id");
  const selectedFlightId = getValue() as string | undefined;

  // Step 5: Return JSX that renders the flight list interface
  return (
    // Step 6: Main section wrapper with custom styling classes
    <section className="custom-card-stack">
      {/* Step 7: Header row containing the title and action buttons */}
      <header className="custom-header-row">
        <h3>{title}</h3>
        {/* Step 8: Header actions container - displays result count and compare button */}
        <div className="custom-header-actions">
          <span>{flights.length} results</span>
          {/* Step 9: Compare button that triggers a comparison of all flights */}
          <button
            type="button"
            className="trigger-link-button"
            onClick={() =>
              // Step 10: Map flight data to the format required for the compare_flights trigger
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
                "Compare flights",
              )
            }>
            Compare
          </button>
        </div>
      </header>
      {/* Step 11: Container for the list of flight cards */}
      <div className="custom-list">
        {/* Step 12: Iterate through each flight and render a card for it */}
        {flights.map((flight) => {
          // Step 13: Check if this flight is currently selected
          const isSelected = selectedFlightId === flight.flight_id;
          return (
            // Step 14: Flight card article element with conditional selected styling
            <article
              key={flight.flight_id}
              className={`custom-card ${isSelected ? "is-selected" : ""}`}>
              {/* Step 15: Display flight image with accessible alt text */}
              <CardImage
                src={flight.image_url}
                alt={`${flight.airline} flight ${flight.flight_id}`}
              />
              {/* Step 16: Top section of card with airline name and total price */}
              <div className="custom-card-top">
                <strong>{flight.airline}</strong>
                <span>${flight.total_price_usd.toLocaleString()}</span>
              </div>
              {/* Step 17: Display route information (origin to destination) */}
              <p>
                {flight.origin} → {flight.destination}
              </p>
              {/* Step 18: Display detailed flight information including date, time, duration, stops, and cabin class */}
              <p>
                {flight.departure_date} at {flight.departure_time_local} •{" "}
                {flight.duration_hours}h • {flight.stops} stop(s) •{" "}
                {flight.cabin_class}
              </p>
              {/* Step 19: Selection button that updates state and triggers the select_flight action */}
              <button
                type="button"
                onClick={() => {
                  // Step 20: Update the selected flight ID in state
                  setValue(flight.flight_id);
                  // Step 21: Fire the select_flight trigger with flight details
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
                    "Select flight",
                  );
                }}>
                {/* Step 22: Display button text based on selection state */}
                {isSelected ? "Selected" : "Choose flight"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
