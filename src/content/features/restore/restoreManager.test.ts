import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOAD_RESTORE_STATE,
  SAVE_RESTORE_STATE,
} from '@/shared/restore/protocol';
import { restoreManager } from './restoreManager';

const sendMessage = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-03T00:00:00Z'));
  sendMessage.mockReset();
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('RestoreManager', () => {
  it('returns the restore state supplied by Background', async () => {
    const state = {
      leagueUid: 'league-1',
      selectedDate: '2026-09-02',
      fixtureUid: 'fixture-1',
      updatedAt: Date.now(),
    };
    sendMessage.mockResolvedValueOnce({ ok: true, data: state });

    await expect(restoreManager.load()).resolves.toEqual(state);
    expect(sendMessage).toHaveBeenCalledWith({ type: LOAD_RESTORE_STATE });
  });

  it('saves league, date, fixture, and the current timestamp', async () => {
    sendMessage.mockResolvedValueOnce({ ok: true, data: undefined });

    await restoreManager.save('league-1', '2026-09-02', 'fixture-1');

    expect(sendMessage).toHaveBeenCalledWith({
      type: SAVE_RESTORE_STATE,
      payload: {
        leagueUid: 'league-1',
        selectedDate: '2026-09-02',
        fixtureUid: 'fixture-1',
        updatedAt: Date.now(),
      },
    });
  });
});
