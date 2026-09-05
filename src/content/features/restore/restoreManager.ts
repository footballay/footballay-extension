import type { RestoreState } from '@/shared/restore/protocol';
import { loadRestoreState, saveRestoreState } from './restoreClient';

class RestoreManager {
  async load(): Promise<RestoreState | undefined> {
    try {
      const response = await loadRestoreState();
      if (!response.ok || !response.data) return undefined;
      return response.data;
    } catch {
      return undefined;
    }
  }

  async save(
    leagueUid: string,
    selectedDate: string,
    fixtureUid: string,
  ): Promise<void> {
    try {
      await saveRestoreState({
        leagueUid,
        selectedDate,
        fixtureUid,
        updatedAt: Date.now(),
      });
    } catch {
      // Content 실행은 persistence 실패와 독립적으로 유지한다.
    }
  }
}

export const restoreManager = new RestoreManager();
