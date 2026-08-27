// @vitest-environment jsdom

import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

const sync = vi.hoisted(() => ({
  startMatchDataSync: vi.fn(),
  stopMatchDataSync: vi.fn(),
}));

vi.mock('@/content/ContentApp', () => ({ ContentApp: () => null }));
vi.mock('@/content/matchDataSync', () => sync);

import { mountToPage } from './mountToPage';

function createContext() {
  let locationChange: (() => void) | undefined;
  let invalidate: (() => void) | undefined;

  return {
    ctx: {
      addEventListener: (
        _target: EventTarget,
        type: string,
        cb: () => void,
      ) => {
        if (type === 'wxt:locationchange') locationChange = cb;
      },
      onInvalidated: (cb: () => void) => {
        invalidate = cb;
        return () => undefined;
      },
    } as unknown as ContentScriptContext,
    locationChange: () => locationChange?.(),
    invalidate: () => invalidate?.(),
  };
}

beforeEach(() => {
  sync.startMatchDataSync.mockClear();
  sync.stopMatchDataSync.mockClear();
  document.getElementById('footballay-content-root')?.remove();
});

afterEach(() => {
  document.getElementById('footballay-content-root')?.remove();
});

describe('mountToPage', () => {
  it('mounts only when SPA navigation enters a live playback route', () => {
    window.history.replaceState({}, '', '/browse');
    const context = createContext();

    mountToPage(context.ctx);
    expect(document.getElementById('footballay-content-root')).toBeNull();
    expect(sync.startMatchDataSync).not.toHaveBeenCalled();

    window.history.replaceState({}, '', '/play/match-a/live');
    act(context.locationChange);
    expect(document.getElementById('footballay-content-root')).toBeTruthy();
    expect(sync.startMatchDataSync).toHaveBeenCalledOnce();

    window.history.replaceState({}, '', '/browse');
    act(context.locationChange);
    expect(document.getElementById('footballay-content-root')).toBeNull();
    expect(sync.stopMatchDataSync).toHaveBeenCalledOnce();
  });

  it('keeps one root across live routes and cleans it up on invalidation', () => {
    window.history.replaceState({}, '', '/play/match-a/live');
    const context = createContext();

    mountToPage(context.ctx);
    const root = document.getElementById('footballay-content-root');
    window.history.replaceState({}, '', '/play/match-b/live');
    act(context.locationChange);

    expect(document.getElementById('footballay-content-root')).toBe(root);
    expect(sync.startMatchDataSync).toHaveBeenCalledOnce();
    expect(sync.stopMatchDataSync).not.toHaveBeenCalled();

    act(context.invalidate);
    expect(document.getElementById('footballay-content-root')).toBeNull();
    expect(sync.stopMatchDataSync).toHaveBeenCalledOnce();
  });
});
