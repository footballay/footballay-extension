import { storage } from 'wxt/utils/storage';

export type LocaleSetting = 'default' | 'ko' | 'en';
export type TimezoneSetting = 'default' | string;

export type ExtensionSettings = {
  enabled: boolean;
  locale: LocaleSetting;
  timezone: TimezoneSetting;
  panelOpacity: number;
  lineupPlayerCardOpacity: number;
};

export const DEFAULT_PANEL_OPACITY = 30;
export const DEFAULT_LINEUP_PLAYER_CARD_OPACITY = 30;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  locale: 'default',
  timezone: 'default',
  panelOpacity: DEFAULT_PANEL_OPACITY,
  lineupPlayerCardOpacity: DEFAULT_LINEUP_PLAYER_CARD_OPACITY,
};

const SETTINGS_KEY = 'local:footballay-settings';

function createSettingsItem() {
  return storage.defineItem<ExtensionSettings>(SETTINGS_KEY, {
    fallback: DEFAULT_SETTINGS,
  });
}

let cachedSettingsItem: ReturnType<typeof createSettingsItem> | undefined;

function settingsItem() {
  return (cachedSettingsItem ??= createSettingsItem());
}

function isTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isOpacity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

export function normalizeSettings(value: unknown): ExtensionSettings {
  const settings = value as Partial<ExtensionSettings> | null;

  return {
    enabled: settings?.enabled !== false,
    locale:
      settings?.locale === 'ko' || settings?.locale === 'en'
        ? settings.locale
        : 'default',
    timezone:
      settings?.timezone === 'default' || isTimezone(settings?.timezone)
        ? settings.timezone
        : 'default',
    panelOpacity: isOpacity(settings?.panelOpacity)
      ? settings.panelOpacity
      : DEFAULT_PANEL_OPACITY,
    lineupPlayerCardOpacity: isOpacity(settings?.lineupPlayerCardOpacity)
      ? settings.lineupPlayerCardOpacity
      : DEFAULT_LINEUP_PLAYER_CARD_OPACITY,
  };
}

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  return normalizeSettings(await settingsItem().getValue());
}

export async function saveExtensionSettings(
  settings: ExtensionSettings,
): Promise<void> {
  await settingsItem().setValue(normalizeSettings(settings));
}

export function watchExtensionSettings(
  onChange: (settings: ExtensionSettings) => void,
): () => void {
  return settingsItem().watch((settings) =>
    onChange(normalizeSettings(settings)),
  );
}
