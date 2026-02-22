"use client";

import { useC1State, useOnAction } from "@thesysai/genui-sdk";

import type { Hotel } from "../types";
import { fireTrigger } from "../triggers";
import { CardImage } from "./CardImage";

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
              <CardImage
                src={hotel.image_url}
                alt={`${hotel.name} in ${hotel.city}`}
              />
              <div className="custom-card-top">
                <strong>{hotel.name}</strong>
                <span>${hotel.nightly_rate_usd}/night</span>
              </div>
              <p>
                {hotel.city} • {hotel.star_rating.toFixed(1)}★ • Walkability{" "}
                {hotel.walkability_score}
              </p>
              <p>
                {hotel.check_in_date} → {hotel.check_out_date} •{" "}
                {hotel.guests} guest(s) • {hotel.rooms} room(s)
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
