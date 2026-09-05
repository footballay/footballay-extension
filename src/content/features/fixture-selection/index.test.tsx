// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FixtureDto } from '@/shared/api/dto';

const selectFixture = vi.hoisted(() => vi.fn());
const saveRestoreState = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('./fixtureSelectionManager', () => ({
  fixtureSelectionManager: { selectFixture },
}));
vi.mock('@/content/features/restore/restoreManager', () => ({
  restoreManager: { save: saveRestoreState },
}));
vi.mock('@/content/features/settings', () => ({
  useSettings: () => ({ settings: { timezone: 'default' } }),
}));

import { useFixtureSelection } from '.';
import {
  createFixtureSelectionState,
  fixtureSelectionStore,
} from './fixtureSelectionStore';

const fixture: FixtureDto = {
  uid: 'fixture-1',
  kickoff: null,
  round: 'Regular Season',
  homeTeam: null,
  awayTeam: null,
  status: { longStatus: 'Not Started', shortStatus: 'NS', elapsed: null },
  score: { home: null, away: null },
  available: true,
};

beforeEach(() => {
  fixtureSelectionStore.setState({
    ...createFixtureSelectionState(),
    selectedLeagueUid: 'league-1',
    selectedDate: '2026-09-02',
    fixtures: [fixture],
  });
  selectFixture.mockClear();
  saveRestoreState.mockClear();
});

afterEach(cleanup);

describe('useFixtureSelection', () => {
  it('saves the Coupang Play restore state when the user selects a fixture', () => {
    const { result } = renderHook(() => useFixtureSelection());

    act(() => result.current.selectFixture('fixture-1'));

    expect(selectFixture).toHaveBeenCalledWith('fixture-1');
    expect(saveRestoreState).toHaveBeenCalledWith(
      'league-1',
      '2026-09-02',
      'fixture-1',
    );
  });
});
