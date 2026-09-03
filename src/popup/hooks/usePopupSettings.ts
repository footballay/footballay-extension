import { useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  loadExtensionSettings,
  saveExtensionSettings,
  type ExtensionSettings,
} from '@/shared/settings/settings';

export function usePopupSettings() {
  const [popupSettings, setPopupSettings] = useState<ExtensionSettings>();

  useEffect(() => {
    let stale = false;

    void loadExtensionSettings().then((settings) => {
      if (!stale) setPopupSettings({ ...DEFAULT_SETTINGS, ...settings });
    });

    return () => {
      stale = true;
    };
  }, []);

  const updateEnabled = (enabled: boolean) => {
    if (!popupSettings) return;
    const nextSettings = { ...popupSettings, enabled };
    setPopupSettings(nextSettings);
    void saveExtensionSettings(nextSettings);
  };

  return { popupSettings, updateEnabled };
}
