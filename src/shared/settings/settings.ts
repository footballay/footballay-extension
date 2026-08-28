import { storage } from 'wxt/utils/storage';

export type LocaleSetting = 'default' | 'ko' | 'en';
export type TimezoneSetting = 'default' | string;

export type ExtensionSettings = {
  locale: LocaleSetting;
  timezone: TimezoneSetting;
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  locale: 'default',
  timezone: 'default',
};

const SETTINGS_KEY = 'local:footballay-settings';
const settingsItem = storage.defineItem<ExtensionSettings>(SETTINGS_KEY, {
  fallback: DEFAULT_SETTINGS,
});

function isTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function normalizeSettings(value: unknown): ExtensionSettings {
  const settings = value as Partial<ExtensionSettings> | null;

  return {
    locale:
      settings?.locale === 'ko' || settings?.locale === 'en'
        ? settings.locale
        : 'default',
    timezone:
      settings?.timezone === 'default' || isTimezone(settings?.timezone)
        ? settings.timezone
        : 'default',
  };
}

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  return normalizeSettings(await settingsItem.getValue());
}

export async function saveExtensionSettings(
  settings: ExtensionSettings,
): Promise<void> {
  await settingsItem.setValue(normalizeSettings(settings));
}

export function watchExtensionSettings(
  onChange: (settings: ExtensionSettings) => void,
): () => void {
  return settingsItem.watch((settings) => onChange(normalizeSettings(settings)));
}
