import { ContentI18nProvider } from '@/shared/i18n/content';
import { PopupView } from './components/PopupView';
import { useCurrentPageFootballay } from './hooks/useCurrentPageFootballay';
import { usePopupSettings } from './hooks/usePopupSettings';

export function Popup() {
  const { popupSettings, updateEnabled } = usePopupSettings();
  const { supported } = useCurrentPageFootballay();

  return (
    <ContentI18nProvider setting={popupSettings?.locale ?? 'default'}>
      <PopupView
        enabled={popupSettings?.enabled}
        supported={supported}
        onEnabledChange={updateEnabled}
      />
    </ContentI18nProvider>
  );
}
