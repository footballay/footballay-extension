import type { LocaleSetting, TimezoneSetting } from './settings';

export function toLocaleOverride(locale: LocaleSetting) {
  return locale === 'default' ? undefined : locale;
}

export function resolveTimezone(timezone: TimezoneSetting) {
  return timezone === 'default'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    : timezone;
}
