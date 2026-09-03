import { t, useContentLocale } from '@/shared/i18n/content';

export function PageAction({
  enabled,
  alreadyMounted,
  onEnabledChange,
  onRun,
}: {
  enabled: boolean | undefined;
  alreadyMounted: boolean | undefined;
  onEnabledChange: (enabled: boolean) => void;
  onRun: () => void;
}) {
  const locale = useContentLocale();

  if (alreadyMounted === undefined) return null;
  if (!alreadyMounted) {
    return (
      <button
        className="footballay-popup__run-button"
        type="button"
        onClick={onRun}
      >
        {t(locale, 'runOnThisPage')}
      </button>
    );
  }

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
