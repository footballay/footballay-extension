import {
  CLEAR_RESTORE_STATE,
  LOAD_RESTORE_STATE,
  SAVE_RESTORE_STATE,
  type RestoreResponse,
  type RestoreState,
} from '@/shared/restore/protocol';

export function loadRestoreState(): Promise<
  RestoreResponse<RestoreState | undefined>
> {
  return chrome.runtime.sendMessage({
    type: LOAD_RESTORE_STATE,
  }) as Promise<RestoreResponse<RestoreState | undefined>>;
}

export function saveRestoreState(
  state: RestoreState,
): Promise<RestoreResponse> {
  return chrome.runtime.sendMessage({
    type: SAVE_RESTORE_STATE,
    payload: state,
  }) as Promise<RestoreResponse>;
}

export function clearRestoreState(): Promise<RestoreResponse> {
  return chrome.runtime.sendMessage({
    type: CLEAR_RESTORE_STATE,
  }) as Promise<RestoreResponse>;
}
