"use client";

import { useSelections } from "../hooks/use-selections";

export function SelectionGate({
  title,
  children,
  lockedMessage = "Select your recommended flight and hotel first.",
}: {
  title: string;
  children: React.ReactNode;
  lockedMessage?: string;
}) {
  const { selectedFlightId, selectedHotelId, hasBothSelections } = useSelections();

  if (!hasBothSelections) {
    return (
      <section className="custom-card-stack">
        <header className="custom-header-row">
          <h3>{title}</h3>
          <span>Locked until selections</span>
        </header>
        <div className="selection-gate">
          <p>{lockedMessage}</p>
          <p>
            Flight: {selectedFlightId ? "Selected" : "Not selected"} • Hotel:{" "}
            {selectedHotelId ? "Selected" : "Not selected"}
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
