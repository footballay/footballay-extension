import { t, useContentLocale } from '@/shared/i18n/content';
import { PageAction } from './PageAction';
import { PopupFooter } from './PopupFooter';

export function PopupView({
  enabled,
  alreadyMounted,
  running,
  onEnabledChange,
  onRun,
}: {
  enabled: boolean | undefined;
  alreadyMounted: boolean | undefined;
  running: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onRun: () => void;
}) {
  const locale = useContentLocale();

  return (
    <main className="footballay-popup">
      <img
        className="footballay-popup__icon"
        src="/footballay_icon.png"
        alt=""
      />
      <h1>Footballay</h1>
      <PageAction
        enabled={enabled}
        alreadyMounted={alreadyMounted}
        running={running}
        onEnabledChange={onEnabledChange}
        onRun={onRun}
      />
      <p className="footballay-popup__description">
        {t(locale, 'popupDescription')}
      </p>
      <PopupFooter />
    </main>
  );
}
