// @vitest-environment jsdom

import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actions = vi.hoisted(() => ({
  refreshMatchData: vi.fn(async () => undefined),
  setMatchDataFixture: vi.fn(),
  statusData: undefined as unknown,
}));
vi.mock('./stores/matchDataStore', () => ({
  setMatchDataFixture: actions.setMatchDataFixture,
  useMatchDataStore: { getState: () => actions },
}));

import { useMatchPickerStore } from './stores/matchPickerStore';
import { startMatchDataSync, stopMatchDataSync } from './matchDataSync';

describe('matchDataSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    actions.refreshMatchData.mockClear();
    actions.setMatchDataFixture.mockClear();
    actions.statusData = undefined;
    useMatchPickerStore.setState({ selectedFixtureUid: undefined });
  });

  afterEach(() => {
    stopMatchDataSync();
    vi.useRealTimers();
  });

  it('starts from the selected fixture, polls after completion, and stops hidden polling', async () => {
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    startMatchDataSync();
    await act(async () => undefined);
    expect(actions.setMatchDataFixture).toHaveBeenLastCalledWith('fixture-1');
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await act(async () => undefined);
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(3);
  });

  it('stops polling after a terminal fixture status', async () => {
    actions.statusData = { liveStatus: { shortStatus: 'FT' } };
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });

    startMatchDataSync();
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTimeAsync(20_000));

    expect(actions.refreshMatchData).toHaveBeenCalledTimes(1);
  });

  it('cleans up the old fixture and prevents overlapping refreshes', async () => {
    let resolveRefresh!: (value?: undefined) => void;
    actions.refreshMatchData.mockReturnValueOnce(
      new Promise<undefined>((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    startMatchDataSync();
    await act(async () => undefined);

    document.dispatchEvent(new Event('visibilitychange'));
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(1);

    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-2' });
    await act(async () => undefined);
    expect(actions.setMatchDataFixture).toHaveBeenLastCalledWith('fixture-2');
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(2);

    resolveRefresh();
    await act(async () => undefined);
    stopMatchDataSync();
    expect(actions.setMatchDataFixture).toHaveBeenLastCalledWith();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-3' });
    expect(actions.refreshMatchData).toHaveBeenCalledTimes(2);
  });
});
