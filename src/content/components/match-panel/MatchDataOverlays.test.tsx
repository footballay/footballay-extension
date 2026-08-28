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
    status: { loadStatus: 'loading' },
    lineup: { loadStatus: 'loading' },
    events: { loadStatus: 'loading' },
    statistics: { loadStatus: 'loading' },
  });
});

describe('MatchDataOverlays', () => {
  it('shows the loading message in every tab while match data is loading', () => {
    render(<MatchDataOverlays />);

    expect(screen.getByText('Loading data')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.getByText('Loading data')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByText('Loading data')).toBeTruthy();
  });

  it('shows only the Statistics resource error in the Statistics tab', () => {
    useMatchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: { loadStatus: 'ready' },
      statistics: { loadStatus: 'error', error: 'statistics failed' },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));

    expect(screen.getByRole('alert').textContent).toBe(
      'Failed to load statistics data: statistics failed',
    );
  });

  it('shows only the Events resource error in the Events tab', () => {
    useMatchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: { loadStatus: 'error', error: 'events failed' },
      statistics: { loadStatus: 'ready' },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));

    expect(screen.getByRole('alert').textContent).toBe(
      'Failed to load events data: events failed',
    );
  });

  it('keeps an empty events timeline without an empty-state message', () => {
    useMatchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: {
        loadStatus: 'ready',
        data: { fixtureUid: 'fixture-1', events: [] },
      },
      statistics: { loadStatus: 'ready' },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));

    expect(screen.getByLabelText('Match events timeline')).toBeTruthy();
    expect(screen.queryByText('No events data.')).toBeNull();
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
