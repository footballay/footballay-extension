export const LOAD_RESTORE_STATE = 'LOAD_RESTORE_STATE';
export const SAVE_RESTORE_STATE = 'SAVE_RESTORE_STATE';

export type RestoreState = {
  leagueUid: string;
  selectedDate: string;
  fixtureUid: string;
  updatedAt: number;
};

export type RestoreResponse<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string };
