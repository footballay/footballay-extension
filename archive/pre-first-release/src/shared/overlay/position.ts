import type { OverlayPosition } from "./types";

export const overlayPositions: OverlayPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "bottom-center"
];

export function getOverlayPositionClass(position: OverlayPosition): string {
  return `footballay-overlay-shell--${position}`;
}
