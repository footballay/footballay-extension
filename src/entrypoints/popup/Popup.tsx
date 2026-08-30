import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  ContentI18nProvider,
  t,
  useContentLocale,
} from '@/shared/i18n/content';
import {
  DEFAULT_SETTINGS,
  loadExtensionSettings,
  saveExtensionSettings,
  type ExtensionSettings,
} from '@/shared/settings/settings';

const SUPPORT_EMAIL = 'physickskim@gmail.com';

function PopupContent({
  enabled,
  onEnabledChange,
}: {
  enabled: boolean | undefined;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const locale = useContentLocale();
  const [toggleReady, setToggleReady] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const version = chrome.runtime.getManifest().version;

  const clearFeedbackTimer = () => {
    if (feedbackTimer.current === undefined) return;
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = undefined;
  };

  useEffect(() => () => clearFeedbackTimer(), []);

  useEffect(() => {
    if (enabled !== undefined) setToggleReady(true);
  }, [enabled]);

  const copySupportEmail = () => {
    void navigator.clipboard.writeText(SUPPORT_EMAIL).then(
      () => {
        clearFeedbackTimer();
        setFeedbackVisible(true);
        feedbackTimer.current = setTimeout(() => {
          feedbackTimer.current = undefined;
          setFeedbackVisible(false);
        }, 1_000);
      },
      () => undefined,
    );
  };

  return (
    <main className="footballay-popup">
      <img
        className="footballay-popup__icon"
        src="/footballay_icon.png"
        alt=""
      />
      <h1>Footballay</h1>
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
      <p className="footballay-popup__description">
        {t(locale, 'popupDescription')}
      </p>
      <p className="footballay-popup__notice">{t(locale, 'popupNotice')}</p>
      <footer className="footballay-popup__footer">
        <section
          className="footballay-popup__contact"
          aria-labelledby="contact"
        >
          <h2 id="contact">{t(locale, 'contact')}</h2>
          <div className="footballay-popup__contact-row">
            <span>{SUPPORT_EMAIL}</span>
            <button
              type="button"
              aria-label={t(locale, 'copy')}
              onClick={copySupportEmail}
            >
              <Copy />
            </button>
            <span
              className={`footballay-popup__feedback${feedbackVisible ? ' footballay-popup__feedback--visible' : ''}`}
            >
              {t(locale, 'copied')}
            </span>
          </div>
        </section>
        <small>v{version}</small>
      </footer>
    </main>
  );
}

export function Popup() {
  const [popupSettings, setPopupSettings] = useState<ExtensionSettings>();

  useEffect(() => {
    let stale = false;

    void loadExtensionSettings().then((settings) => {
      if (!stale) setPopupSettings({ ...DEFAULT_SETTINGS, ...settings });
    });

    return () => {
      stale = true;
    };
  }, []);

  const updateEnabled = (enabled: boolean) => {
    if (!popupSettings) return;
    const nextSettings = { ...popupSettings, enabled };
    setPopupSettings(nextSettings);
    void saveExtensionSettings(nextSettings);
  };

  return (
    <ContentI18nProvider setting={popupSettings?.locale ?? 'default'}>
      <PopupContent
        enabled={popupSettings?.enabled}
        onEnabledChange={updateEnabled}
      />
    </ContentI18nProvider>
  );
}
