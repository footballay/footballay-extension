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
  DEFAULT_LINEUP_PLAYER_CARD_OPACITY,
  DEFAULT_PANEL_OPACITY,
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
  it('uses the default panel opacity constant', () => {
    expect(DEFAULT_PANEL_OPACITY).toBe(90);
    expect(DEFAULT_SETTINGS.panelOpacity).toBe(DEFAULT_PANEL_OPACITY);
    expect(DEFAULT_LINEUP_PLAYER_CARD_OPACITY).toBe(100);
    expect(DEFAULT_SETTINGS.lineupPlayerCardOpacity).toBe(
      DEFAULT_LINEUP_PLAYER_CARD_OPACITY,
    );
  });

  it('uses defaults and normalizes invalid persisted values', async () => {
    expect(await loadExtensionSettings()).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ locale: 'fr', timezone: 'UTC+9' })).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(normalizeSettings({ locale: 'ko', timezone: 'Asia/Seoul' })).toEqual(
      {
        locale: 'ko',
        timezone: 'Asia/Seoul',
        panelOpacity: DEFAULT_PANEL_OPACITY,
        lineupPlayerCardOpacity: DEFAULT_LINEUP_PLAYER_CARD_OPACITY,
      },
    );
  });

  it.each([0, 50, 100])('keeps a valid panel opacity: %s', (panelOpacity) => {
    expect(normalizeSettings({ panelOpacity })).toMatchObject({
      panelOpacity,
    });
  });

  it.each([0, 50, 100])(
    'keeps a valid lineup player card opacity: %s',
    (lineupPlayerCardOpacity) => {
      expect(normalizeSettings({ lineupPlayerCardOpacity })).toMatchObject({
        lineupPlayerCardOpacity,
      });
    },
  );

  it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY, '50'])(
    'defaults an invalid panel opacity: %s',
    (panelOpacity) => {
      expect(normalizeSettings({ panelOpacity })).toMatchObject({
        panelOpacity: DEFAULT_PANEL_OPACITY,
        lineupPlayerCardOpacity: DEFAULT_LINEUP_PLAYER_CARD_OPACITY,
      });
    },
  );

  it('persists normalized settings and reflects storage changes', async () => {
    const changes: unknown[] = [];
    const unwatch = watchExtensionSettings((settings) =>
      changes.push(settings),
    );

    await saveExtensionSettings({
      locale: 'ko',
      timezone: 'Asia/Seoul',
      panelOpacity: 50,
      lineupPlayerCardOpacity: 50,
    });
    expect(await loadExtensionSettings()).toEqual({
      locale: 'ko',
      timezone: 'Asia/Seoul',
      panelOpacity: 50,
      lineupPlayerCardOpacity: 50,
    });

    storageState.notify({
      locale: 'en',
      timezone: 'Europe/London',
      panelOpacity: 0,
      lineupPlayerCardOpacity: 100,
    });
    expect(changes).toEqual([
      {
        locale: 'ko',
        timezone: 'Asia/Seoul',
        panelOpacity: 50,
        lineupPlayerCardOpacity: 50,
      },
      {
        locale: 'en',
        timezone: 'Europe/London',
        panelOpacity: 0,
        lineupPlayerCardOpacity: 100,
      },
    ]);
    unwatch();
  });
});
