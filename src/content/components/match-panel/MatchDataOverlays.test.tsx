// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { MatchDataOverlays } from './MatchDataOverlays';

afterEach(cleanup);

beforeEach(() => {
  useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
  useMatchDataStore.setState({
    status: 'loading',
    lineup: undefined,
    events: undefined,
    statistics: undefined,
  });
});

describe('MatchDataOverlays', () => {
  it('shows the loading message in every tab while match data is loading', () => {
    render(<MatchDataOverlays />);

    expect(screen.getByText('데이터 불러오는 중')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.getByText('데이터 불러오는 중')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByText('데이터 불러오는 중')).toBeTruthy();
  });

  it('collapses and expands the match panel', () => {
    render(<MatchDataOverlays />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Minimize match panel' }),
    );
    expect(
      screen.getByRole('button', { name: 'Open match panel' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Open match panel' }));
    expect(screen.getByRole('tab', { name: 'Lineup' })).toBeTruthy();
  });
});
