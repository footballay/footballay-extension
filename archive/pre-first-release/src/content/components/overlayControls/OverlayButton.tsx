import { PanelLeftOpen } from "lucide-react";
import "@/content/styles/overlay-button.css";
import { t } from "@/shared/i18n/locale";

type OverlayButtonProps = {
  label?: string;
  muted?: boolean;
  onClick: () => void;
};

export function OverlayButton({ label, muted = false, onClick }: OverlayButtonProps) {
  return (
    <button
      aria-label={label ?? t("content.overlay.aria.open")}
      className={`footballay-overlay-button${muted ? " footballay-overlay-button--muted" : ""}`}
      type="button"
      onClick={onClick}
    >
      {label ?? <PanelLeftOpen aria-hidden size={15} strokeWidth={2.2} />}
    </button>
  );
}
