// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentApp } from './ContentApp';
import { useLeagueStore } from './stores/leagueStore';

const loadAvailableLeagues = vi.fn(async () => undefined);

afterEach(cleanup);

beforeEach(() => {
    loadAvailableLeagues.mockClear();
    useLeagueStore.setState({
        leagues: [
            { uid: 'league-1', name: 'Premier League', nameKo: '프리미어리그' },
            { uid: 'league-2', name: 'La Liga' },
        ],
        status: 'ready',
        error: undefined,
        selectedLeagueUid: 'league-1',
        loadAvailableLeagues,
    });
});

describe('ContentApp', () => {
    it('renders league labels and keeps a clicked selection in the store', async () => {
        const user = userEvent.setup();
        render(<ContentApp />);

        expect(screen.getByRole('button', { name: '프리미어리그' }).getAttribute('aria-pressed')).toBe('true');
        await user.click(screen.getByRole('button', { name: 'La Liga' }));
        expect(useLeagueStore.getState().selectedLeagueUid).toBe('league-2');
    });
});
