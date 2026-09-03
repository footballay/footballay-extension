import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { t, useContentLocale } from '@/shared/i18n/content';

const SUPPORT_EMAIL = 'physickskim@gmail.com';

export function PopupFooter() {
  const locale = useContentLocale();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const clearFeedbackTimer = () => {
    if (feedbackTimer.current === undefined) return;
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = undefined;
  };

  useEffect(() => () => clearFeedbackTimer(), []);

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
    <footer className="footballay-popup__footer">
      <section className="footballay-popup__contact" aria-labelledby="contact">
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
      <small>v{chrome.runtime.getManifest().version}</small>
    </footer>
  );
}
