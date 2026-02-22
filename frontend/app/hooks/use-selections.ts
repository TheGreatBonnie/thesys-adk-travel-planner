"use client";

import { useC1State } from "@thesysai/genui-sdk";

export function useSelections() {
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
