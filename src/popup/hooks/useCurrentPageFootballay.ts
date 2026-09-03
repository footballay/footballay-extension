import { useEffect, useState } from 'react';
import {
  getActiveTabMountStatus,
  runOnCurrentTab,
} from '../currentPageFootballay';

export function useCurrentPageFootballay() {
  const [alreadyMounted, setAlreadyMounted] = useState<boolean>();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let stale = false;

    void getActiveTabMountStatus().then(
      (status) => {
        if (!stale) setAlreadyMounted(status?.mounted);
      },
      () => undefined,
    );

    return () => {
      stale = true;
    };
  }, []);

  const runOnCurrentPage = () => {
    if (running) return;

    setRunning(true);
    void runOnCurrentTab()
      .then(
        (mounted) => mounted && setAlreadyMounted(true),
        () => undefined,
      )
      .finally(() => setRunning(false));
  };

  return { alreadyMounted, running, runOnCurrentPage };
}
