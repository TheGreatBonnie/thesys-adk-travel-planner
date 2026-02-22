"use client";

import { useOnAction } from "@thesysai/genui-sdk";

import type { CostBreakdown } from "../types";
import { fireTrigger } from "../triggers";
import { useSelections } from "../hooks/use-selections";
import { SelectionGate } from "./SelectionGate";

export function BudgetBreakdown({
  estimated_cost_breakdown_usd,
  title = "Budget Breakdown",
}: {
  estimated_cost_breakdown_usd: CostBreakdown;
  title?: string;
}) {
  const onAction = useOnAction();
  const { selectedFlightId, selectedHotelId } = useSelections();
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
    <SelectionGate
      title={title}
      lockedMessage="Budget appears after flight and hotel are selected."
    >
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
    </SelectionGate>
  );
}
