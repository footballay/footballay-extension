import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageState = vi.hoisted(() => {
  let value: unknown = null;
  let listener: ((next: unknown) => void) | undefined;

  return {
    get value() {
      return value;
    },
    set value(next: unknown) {
      value = next;
    },
    defineItem: vi.fn(() => ({
      getValue: vi.fn(async () => value),
      setValue: vi.fn(async (next: unknown) => {
        value = next;
        listener?.(next);
      }),
      watch: vi.fn((nextListener: (next: unknown) => void) => {
        listener = nextListener;
        return () => {
          listener = undefined;
        };
      }),
    })),
    notify(next: unknown) {
      value = next;
      listener?.(next);
    },
  };
});

vi.mock('wxt/utils/storage', () => ({
  storage: { defineItem: storageState.defineItem },
}));

import {
  DEFAULT_SETTINGS,
  loadExtensionSettings,
  normalizeSettings,
  saveExtensionSettings,
  watchExtensionSettings,
} from './settings';

beforeEach(() => {
  storageState.value = null;
});

describe('settings storage', () => {
  it('uses defaults and normalizes invalid persisted values', async () => {
    expect(await loadExtensionSettings()).toEqual(DEFAULT_SETTINGS);
    expect(
      normalizeSettings({ locale: 'fr', timezone: 'UTC+9' }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('persists normalized settings and reflects storage changes', async () => {
    const changes: unknown[] = [];
    const unwatch = watchExtensionSettings((settings) => changes.push(settings));

    await saveExtensionSettings({ locale: 'ko', timezone: 'Asia/Seoul' });
    expect(await loadExtensionSettings()).toEqual({
      locale: 'ko',
      timezone: 'Asia/Seoul',
    });

    storageState.notify({ locale: 'en', timezone: 'Europe/London' });
    expect(changes).toEqual([
      { locale: 'ko', timezone: 'Asia/Seoul' },
      { locale: 'en', timezone: 'Europe/London' },
    ]);
    unwatch();
  });
});
