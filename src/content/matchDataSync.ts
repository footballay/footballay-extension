import {
  setMatchDataFixture,
  useMatchDataStore,
} from './stores/matchDataStore';
import { useMatchPickerStore } from './stores/matchPickerStore';

const POLLING_INTERVAL_MS = 5_000;

let unsubscribe: (() => void) | undefined;
let stopFixturePolling: (() => void) | undefined;
let currentFixtureUid: string | undefined;

export function startMatchDataSync() {
  stopMatchDataSync();

  setSyncFixture(useMatchPickerStore.getState().selectedFixtureUid);

  unsubscribe = useMatchPickerStore.subscribe((state) => {
    if (state.selectedFixtureUid === currentFixtureUid) return;

    setSyncFixture(state.selectedFixtureUid);
  });
}

export function stopMatchDataSync() {
  unsubscribe?.();
  unsubscribe = undefined;

  stopFixturePolling?.();
  stopFixturePolling = undefined;

  currentFixtureUid = undefined;
  setMatchDataFixture();
}

function setSyncFixture(fixtureUid?: string) {
  stopFixturePolling?.();
  stopFixturePolling = undefined;

  currentFixtureUid = fixtureUid;
  setMatchDataFixture(fixtureUid);

  if (!fixtureUid) return;

  stopFixturePolling = startFixturePolling();
}

function startFixturePolling(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let refreshing = false;
  let disposed = false;

  async function refreshAndSchedule() {
    if (disposed || document.hidden || refreshing) return;

    refreshing = true;

    try {
      await useMatchDataStore.getState().refreshMatchData();
    } finally {
      refreshing = false;
    }

    if (!disposed && !document.hidden) {
      timer = setTimeout(() => void refreshAndSchedule(), POLLING_INTERVAL_MS);
    }
  }

  function handleVisibilityChange() {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }

    if (!document.hidden) {
      void refreshAndSchedule();
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  void refreshAndSchedule();

  return () => {
    disposed = true;

    if (timer) {
      clearTimeout(timer);
    }

    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
