import { ChartNoAxesColumn, UserRound, X } from "lucide-react";
import "@/content/styles/edge-handle.css";
import { t } from "@/shared/i18n/locale";

type SideDrawerHandleProps = {
  active?: boolean;
  onClick: () => void;
  side: "left" | "right";
};

const labels = {
  left: "content.drawer.left.open",
  right: "content.drawer.right.open"
} as const;

export function SideDrawerHandle({ active = false, onClick, side }: SideDrawerHandleProps) {
  const Icon = active ? X : side === "left" ? ChartNoAxesColumn : UserRound;

  return (
    <button
      className={`footballay-edge-handle footballay-edge-handle--${side}${
        active ? " footballay-edge-handle--active" : ""
      }`}
      type="button"
      onClick={onClick}
      aria-label={t(labels[side])}
      title={t(labels[side])}
    >
      <Icon aria-hidden size={16} strokeWidth={2.2} />
    </button>
  );
}
