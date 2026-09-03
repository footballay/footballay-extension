import type { RestoreState } from '@/shared/restore/protocol';
import {
  clearRestoreState,
  loadRestoreState,
  saveRestoreState,
} from './restoreClient';
import { isRestoreExpired } from './restoreExpiration';

class RestoreManager {
  async load(): Promise<RestoreState | undefined> {
    try {
      const response = await loadRestoreState();
      if (!response.ok || !response.data) return undefined;

      if (!isRestoreExpired(response.data.updatedAt)) return response.data;

      await this.clear();
      return undefined;
    } catch {
      return undefined;
    }
  }

  async save(leagueUid: string, fixtureUid: string): Promise<void> {
    try {
      await saveRestoreState({
        leagueUid,
        fixtureUid,
        updatedAt: Date.now(),
      });
    } catch {
      // Content 실행은 persistence 실패와 독립적으로 유지한다.
    }
  }

  async clear(): Promise<void> {
    try {
      await clearRestoreState();
    } catch {
      // 이미 사용할 수 없는 extension context이므로 정리할 수 없다.
    }
  }
}

export const restoreManager = new RestoreManager();
