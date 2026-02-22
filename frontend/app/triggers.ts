"use client";

import { useOnAction } from "@thesysai/genui-sdk";

export type TriggerPayload = Record<string, unknown>;
export type OnActionFn = ReturnType<typeof useOnAction>;

export function fireTrigger(
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
