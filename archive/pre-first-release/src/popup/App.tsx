import { useEffect, useState } from "react";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { defaultSettings } from "@/shared/constants";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { readSettings, writeSettings } from "@/shared/storage";

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);

  useEffect(() => {
    void readSettings().then(setSettings);
  }, []);

  return (
    <main className="footballay-popup">
      <OverlaySettingsSection
        extensionEnabled={settings.extensionEnabled}
        overlayPosition={settings.overlayPosition}
        onChangeSettings={(patch) => void writeSettings(patch).then(setSettings)}
      />
    </main>
  );
}
