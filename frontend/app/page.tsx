"use client";

import { themePresets } from "@crayonai/react-ui";
import { C1Chat } from "@thesysai/genui-sdk";

export default function HomePage() {
  return (
    <main>
      <C1Chat
        apiUrl="http://127.0.0.1:8000/api/chat"
        formFactor="full-page"
        agentName="Travel Planner"
        theme={{ mode: "dark" }}
      />
    </main>
  );
}
