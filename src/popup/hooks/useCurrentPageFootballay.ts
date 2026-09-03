import { useEffect, useState } from 'react';
import {
  getActiveTabMountStatus,
  runOnCurrentTab,
} from '../currentPageFootballay';

export function useCurrentPageFootballay() {
  const [alreadyMounted, setAlreadyMounted] = useState<boolean>();

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
    void runOnCurrentTab().then(
      (mounted) => mounted && setAlreadyMounted(true),
      () => undefined,
    );
  };

  return { alreadyMounted, runOnCurrentPage };
}
