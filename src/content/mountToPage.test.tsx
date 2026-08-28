// @vitest-environment jsdom

import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

const sync = vi.hoisted(() => ({
  stopMatchDataSync: vi.fn(),
}));

vi.mock('@/content/ContentApp', () => ({ ContentApp: () => null }));
vi.mock('@/content/matchDataSync', () => sync);

import { mountToPage } from './mountToPage';

function createContext() {
  let invalidate: (() => void) | undefined;

  return {
    ctx: {
      onInvalidated: (cb: () => void) => {
        invalidate = cb;
        return () => undefined;
      },
    } as unknown as ContentScriptContext,
    invalidate: () => invalidate?.(),
  };
}

beforeEach(() => {
  sync.stopMatchDataSync.mockClear();
  document.getElementById('footballay-content-root')?.remove();
});

afterEach(() => {
  document.getElementById('footballay-content-root')?.remove();
});

describe('mountToPage', () => {
  it('mounts on every Coupang Play route', () => {
    window.history.replaceState({}, '', '/browse');
    const context = createContext();

    mountToPage(context.ctx);
    expect(document.getElementById('footballay-content-root')).toBeTruthy();
    expect(sync.stopMatchDataSync).not.toHaveBeenCalled();
  });

  it('cleans up on invalidation', () => {
    const context = createContext();

    mountToPage(context.ctx);

    act(context.invalidate);
    expect(document.getElementById('footballay-content-root')).toBeNull();
    expect(sync.stopMatchDataSync).toHaveBeenCalledOnce();
  });
});
