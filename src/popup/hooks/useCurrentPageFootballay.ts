import { useEffect, useState } from 'react';

export function useCurrentPageFootballay() {
  const [supported, setSupported] = useState<boolean>();

  useEffect(() => {
    let stale = false;

    void chrome.tabs
      .query({
        active: true,
        currentWindow: true,
        url: ['https://www.coupangplay.com/*'],
      })
      .then(
        (tabs) => !stale && setSupported(tabs.length > 0),
        () => !stale && setSupported(false),
      );

    return () => {
      stale = true;
    };
  }, []);

  return { supported };
}
