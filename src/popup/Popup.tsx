import { ContentI18nProvider } from '@/shared/i18n/content';
import { PopupView } from './components/PopupView';
import { useCurrentPageFootballay } from './hooks/useCurrentPageFootballay';
import { usePopupSettings } from './hooks/usePopupSettings';

export function Popup() {
  const { popupSettings, updateEnabled } = usePopupSettings();
  const { alreadyMounted, running, runOnCurrentPage } =
    useCurrentPageFootballay();

  return (
    <ContentI18nProvider setting={popupSettings?.locale ?? 'default'}>
      <PopupView
        enabled={popupSettings?.enabled}
        alreadyMounted={alreadyMounted}
        running={running}
        onEnabledChange={updateEnabled}
        onRun={runOnCurrentPage}
      />
    </ContentI18nProvider>
  );
}
