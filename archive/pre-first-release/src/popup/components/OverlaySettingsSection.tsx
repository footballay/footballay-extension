import { GitBranch, Mail } from "lucide-react";
import { t } from "@/shared/i18n/locale";
import type { ExtensionSettings, OverlayPosition } from "@/shared/overlay/types";
import { overlayPositions } from "@/shared/overlay/position";

type OverlaySettingsSectionProps = {
  extensionEnabled: boolean;
  overlayPosition: OverlayPosition;
  onChangeSettings: (patch: Partial<ExtensionSettings>) => void;
};

const overlayPositionLabels: Record<OverlayPosition, string> = {
  "bottom-center": t("overlayPosition.bottomCenter"),
  "bottom-left": t("overlayPosition.bottomLeft"),
  "bottom-right": t("overlayPosition.bottomRight"),
  "top-left": t("overlayPosition.topLeft"),
  "top-right": t("overlayPosition.topRight")
};

const contactLinks = {
  email: "physickskim@gmail.com",
  github: "https://github.com/PhysicksKim"
};

export function OverlaySettingsSection({
  extensionEnabled,
  overlayPosition,
  onChangeSettings
}: OverlaySettingsSectionProps) {
  return (
    <section className="footballay-settings">
      <label className="footballay-settings-row">
        <span>{t("popup.settings.extensionEnabled")}</span>
        <input
          checked={extensionEnabled}
          type="checkbox"
          onChange={(event) =>
            onChangeSettings({ extensionEnabled: event.currentTarget.checked })
          }
        />
      </label>

      <label className="footballay-settings-row footballay-settings-row--select">
        <span>{t("popup.settings.overlayPosition")}</span>
        <select
          value={overlayPosition}
          onChange={(event) =>
            onChangeSettings({ overlayPosition: event.currentTarget.value as OverlayPosition })
          }
        >
          {overlayPositions.map((position) => (
            <option key={position} value={position}>
              {overlayPositionLabels[position]}
            </option>
          ))}
        </select>
      </label>

      <div className="footballay-settings-spacer" aria-hidden />

      <footer className="footballay-settings-footer">
        <a href={contactLinks.github} target="_blank" rel="noreferrer">
          <GitBranch aria-hidden size={14} strokeWidth={2.2} />
          <span>GitHub</span>
        </a>
        <a href={`mailto:${contactLinks.email}`}>
          <Mail aria-hidden size={14} strokeWidth={2.2} />
          <span>{contactLinks.email}</span>
        </a>
      </footer>
    </section>
  );
}
