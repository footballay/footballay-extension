import { t, useContentLocale } from '@/shared/i18n/content';
import { PageAction } from './PageAction';
import { PopupFooter } from './PopupFooter';

export function PopupView({
  enabled,
  supported,
  onEnabledChange,
}: {
  enabled: boolean | undefined;
  supported: boolean | undefined;
  onEnabledChange: (enabled: boolean) => void;
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
        supported={supported}
        onEnabledChange={onEnabledChange}
      />
      <p className="footballay-popup__description">
        {t(locale, 'popupDescription')}
      </p>
      <PopupFooter />
    </main>
  );
}
