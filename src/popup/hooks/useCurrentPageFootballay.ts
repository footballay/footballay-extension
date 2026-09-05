import { useEffect, useState } from 'react';

export function useCurrentPageFootballay() {
  const [supported, setSupported] = useState<boolean>();

  useEffect(() => {
    let stale = false;
    void (async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id === undefined) return false;

      const contexts = await chrome.runtime.getContexts({
        tabIds: [tab.id],
        documentOrigins: ['https://www.coupangplay.com'],
      });
      return contexts.some((context) => context.frameId === 0);
    })().then(
      (value) => !stale && setSupported(value),
      () => !stale && setSupported(false),
    );

    return () => {
      stale = true;
    };
  }, []);
  return { supported };
}
