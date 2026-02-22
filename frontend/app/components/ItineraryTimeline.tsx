"use client";

import { useOnAction } from "@thesysai/genui-sdk";

import type { ItineraryDay } from "../types";
import { fireTrigger } from "../triggers";
import { CardImage } from "./CardImage";
import { SelectionGate } from "./SelectionGate";

export function ItineraryTimeline({
  days,
  title = "Daily Itinerary",
}: {
  days: ItineraryDay[];
  title?: string;
}) {
  const onAction = useOnAction();

  return (
    <SelectionGate title={title}>
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
                <CardImage src={day.image_url} alt={`Itinerary day ${day.date}`} />
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
    </SelectionGate>
  );
}
