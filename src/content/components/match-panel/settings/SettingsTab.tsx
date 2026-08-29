import { useEffect, useState } from 'react';
import { useSettings } from '@/content/features/settings';
import { t, useContentLocale } from '@/shared/i18n/content';
import type { LocaleSetting } from '@/shared/settings/settings';
import { resolveTimezone } from '@/shared/settings/resolution';

const timezoneOptions = Intl.supportedValuesOf?.('timeZone') ?? [];

function isTimezone(value: string) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function SettingsTab() {
  const locale = useContentLocale();
  const { settings, updateSettings } = useSettings();
  const [timezoneInput, setTimezoneInput] = useState(
    settings.timezone === 'default' ? '' : settings.timezone,
  );
  const [customTimezone, setCustomTimezone] = useState(
    settings.timezone !== 'default',
  );

  useEffect(() => {
    setTimezoneInput(settings.timezone === 'default' ? '' : settings.timezone);
    setCustomTimezone(settings.timezone !== 'default');
  }, [settings.timezone]);

  return (
    <div className="footballay-match-panel__settings">
      <label>
        <span>{t(locale, 'language')}</span>
        <select
          aria-label={t(locale, 'language')}
          value={settings.locale}
          onChange={(event) =>
            void updateSettings({
              ...settings,
              locale: event.target.value as LocaleSetting,
            })
          }
        >
          <option value="default">{t(locale, 'default')}</option>
          <option value="ko">{t(locale, 'korean')}</option>
          <option value="en">{t(locale, 'english')}</option>
        </select>
      </label>
      <label>
        <span>{t(locale, 'timezone')}</span>
        <select
          aria-label={t(locale, 'timezone')}
          value={
            settings.timezone === 'default' && !customTimezone
              ? 'default'
              : 'custom'
          }
          onChange={(event) => {
            if (event.target.value === 'default') {
              setCustomTimezone(false);
              void updateSettings({ ...settings, timezone: 'default' });
            } else {
              setCustomTimezone(true);
            }
          }}
        >
          <option value="default">
            {t(locale, 'default')} ({resolveTimezone('default')})
          </option>
          <option value="custom">{t(locale, 'customTimezone')}</option>
        </select>
      </label>
      {(settings.timezone !== 'default' || customTimezone) && (
        <input
          aria-label={t(locale, 'customTimezone')}
          list="footballay-timezones"
          type="search"
          value={timezoneInput}
          onChange={(event) => {
            const timezone = event.target.value;
            setTimezoneInput(timezone);
            if (isTimezone(timezone)) {
              void updateSettings({ ...settings, timezone });
            }
          }}
        />
      )}
      <datalist id="footballay-timezones">
        {timezoneOptions.map((timezone) => (
          <option key={timezone} value={timezone} />
        ))}
      </datalist>
    </div>
  );
}
