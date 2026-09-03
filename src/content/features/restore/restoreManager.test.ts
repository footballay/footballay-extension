import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLEAR_RESTORE_STATE,
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
  it('loads a restore state within six hours', async () => {
    const state = {
      leagueUid: 'league-1',
      fixtureUid: 'fixture-1',
      updatedAt: Date.now() - 6 * 60 * 60 * 1_000,
    };
    sendMessage.mockResolvedValueOnce({ ok: true, data: state });

    await expect(restoreManager.load()).resolves.toEqual(state);
    expect(sendMessage).toHaveBeenCalledWith({ type: LOAD_RESTORE_STATE });
  });

  it('clears and ignores an expired restore state', async () => {
    sendMessage
      .mockResolvedValueOnce({
        ok: true,
        data: {
          leagueUid: 'league-1',
          fixtureUid: 'fixture-1',
          updatedAt: Date.now() - 6 * 60 * 60 * 1_000 - 1,
        },
      })
      .mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(restoreManager.load()).resolves.toBeUndefined();
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      type: CLEAR_RESTORE_STATE,
    });
  });

  it('saves only league, fixture, and the current timestamp', async () => {
    sendMessage.mockResolvedValueOnce({ ok: true, data: undefined });

    await restoreManager.save('league-1', 'fixture-1');

    expect(sendMessage).toHaveBeenCalledWith({
      type: SAVE_RESTORE_STATE,
      payload: {
        leagueUid: 'league-1',
        fixtureUid: 'fixture-1',
        updatedAt: Date.now(),
      },
    });
  });
});
