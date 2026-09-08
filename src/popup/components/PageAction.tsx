import * as Tooltip from '@radix-ui/react-tooltip';
import { t, useContentLocale } from '@/shared/i18n/content';

export function PageAction({
  enabled,
  supported,
  onEnabledChange,
}: {
  enabled: boolean | undefined;
  supported: boolean | undefined;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const locale = useContentLocale();

  if (supported === undefined) return null;
  if (!supported)
    return (
      <p className="footballay-popup__unsupported">
        {t(locale, 'popupUnsupportedSitePrefix')}
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className="footballay-popup__supported-sites"
                type="button"
              >
                {t(locale, 'popupSupportedSites')}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="footballay-popup__supported-sites-tooltip"
                side="top"
                sideOffset={5}
              >
                {t(locale, 'popupSupportedSitesTooltip')}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        {t(locale, 'popupUnsupportedSiteSuffix')}
      </p>
    );

  const toggleReady = enabled !== undefined;
  return (
    <button
      className={`footballay-popup__enabled-toggle${toggleReady ? '' : ' footballay-popup__enabled-toggle--loading'}`}
      type="button"
      role="switch"
      aria-label="Footballay"
      aria-checked={enabled ?? false}
      disabled={!toggleReady}
      onClick={() => onEnabledChange(!(enabled ?? false))}
    >
      <span />
    </button>
  );
}
