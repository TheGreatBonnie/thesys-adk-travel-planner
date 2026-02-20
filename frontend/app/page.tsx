"use client";

import { C1Chat } from "@thesysai/genui-sdk";
import {
  BudgetBreakdown,
  FlightList,
  HotelCardGrid,
  ItineraryTimeline,
} from "./components";

export default function HomePage() {
  return (
    <main>
      <C1Chat
        apiUrl="http://127.0.0.1:8000/api/chat"
        formFactor="full-page"
        agentName="Travel Planner"
        theme={{ mode: "dark" }}
        customizeC1={{
          customComponents: {
            FlightList,
            HotelCardGrid,
            ItineraryTimeline,
            BudgetBreakdown,
          },
        }}
      />
    </main>
  );
}
