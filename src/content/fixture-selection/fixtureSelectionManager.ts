import {
  requestAvailableLeagues,
  requestFixtureDates,
  requestFixtures,
} from '@/shared/api/client';
import type { GetFixturesPayload } from '@/shared/api/protocol';
import {
  addDateDays,
  calendarRange,
  instantToDate,
  todayInTimezone,
} from '@/content/utils/date';
import {
  resolveTimezone,
  toLocaleOverride,
} from '@/shared/settings/resolution';
import { getSettings } from '@/content/settings';
import { matchData } from '@/content/match-data';
import {
  createFixtureSelectionState,
  fixtureSelectionStore,
} from './fixtureSelectionStore';

export type FixtureSelectionSettingsChange = {
  localeChanged: boolean;
  timezoneChanged: boolean;
};

class FixtureSelectionManager {
  private latestFixtureRequestId = 0;
  private latestFixtureDatesRequestId = 0;
  private latestLeagueRequestId = 0;

  initialize(): Promise<void> {
    return this.loadAvailableLeagues();
  }

  dispose(): void {
    ++this.latestFixtureRequestId;
    ++this.latestFixtureDatesRequestId;
    ++this.latestLeagueRequestId;
    fixtureSelectionStore.setState(createFixtureSelectionState());
  }

  async loadAvailableLeagues(): Promise<void> {
    const requestId = ++this.latestLeagueRequestId;

    fixtureSelectionStore.setState({
      leagueStatus: 'loading',
      leagueError: undefined,
    });

    try {
      const localeOverride = toLocaleOverride(getSettings().locale);
      const response = await requestAvailableLeagues(
        localeOverride ? { localeOverride } : undefined,
      );

      if (requestId !== this.latestLeagueRequestId) return;

      if (!response.ok) {
        fixtureSelectionStore.setState({
          leagueStatus: 'error',
          leagueError: response.error,
        });
        return;
      }

      fixtureSelectionStore.setState({
        leagues: response.data,
        leagueStatus: 'ready',
        leagueError: undefined,
      });
    } catch (error) {
      if (requestId !== this.latestLeagueRequestId) return;

      fixtureSelectionStore.setState({
        leagueStatus: 'error',
        leagueError:
          error instanceof Error
            ? error.message
            : 'Unable to load available leagues',
      });
    }
  }

  async selectLeague(leagueUid: string): Promise<void> {
    ++this.latestFixtureDatesRequestId;
    fixtureSelectionStore.setState({
      selectedLeagueUid: leagueUid,
      selectedFixtureUid: undefined,
      fixtureDates: [],
    });
    matchData.clearFixture();

    const timezone = resolveTimezone(getSettings().timezone);
    await this.loadFixtures(leagueUid, todayInTimezone(timezone), 'nearest');
  }

  async navigateDate(direction: 'previous' | 'next'): Promise<void> {
    const { selectedDate, selectedLeagueUid } =
      fixtureSelectionStore.getState();
    if (!selectedLeagueUid || !selectedDate) return;

    await this.loadFixtures(
      selectedLeagueUid,
      addDateDays(selectedDate, direction === 'previous' ? -1 : 1),
      direction === 'previous' ? 'previous' : 'nearest',
    );
  }

  async selectDate(date: string): Promise<void> {
    const { selectedLeagueUid } = fixtureSelectionStore.getState();
    if (!selectedLeagueUid) return;

    await this.loadFixtures(selectedLeagueUid, date, 'exact');
  }

  async loadFixtureDates(date: string): Promise<void> {
    const { selectedLeagueUid } = fixtureSelectionStore.getState();
    if (!selectedLeagueUid) return;

    const requestId = ++this.latestFixtureDatesRequestId;
    const { startDate, endDate } = calendarRange(date);
    fixtureSelectionStore.setState({ fixtureDates: [] });

    try {
      const timezone = resolveTimezone(getSettings().timezone);
      const response = await requestFixtureDates({
        leagueUid: selectedLeagueUid,
        startDate,
        endDate,
        timezone,
      });

      if (requestId !== this.latestFixtureDatesRequestId) return;
      fixtureSelectionStore.setState({
        fixtureDates: response.ok ? response.data : [],
      });
    } catch {
      if (requestId !== this.latestFixtureDatesRequestId) return;
      fixtureSelectionStore.setState({ fixtureDates: [] });
    }
  }

  selectFixture(fixtureUid: string): void {
    const { fixtures, selectedFixtureUid } = fixtureSelectionStore.getState();
    const fixture = fixtures.find((candidate) => candidate.uid === fixtureUid);
    if (!fixture) return;

    fixtureSelectionStore.setState({ selectedFixtureUid: fixtureUid });

    if (selectedFixtureUid === fixtureUid) {
      matchData.updateFixtureInfo(fixture);
      return;
    }

    matchData.activateFixture(fixture);
  }

  async reloadForSettings(
    change: FixtureSelectionSettingsChange,
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (change.localeChanged) {
      tasks.push(this.loadAvailableLeagues());
    }

    const { selectedLeagueUid, selectedDate } =
      fixtureSelectionStore.getState();
    if (
      selectedLeagueUid &&
      selectedDate &&
      (change.localeChanged || change.timezoneChanged)
    ) {
      tasks.push(
        this.loadFixtures(
          selectedLeagueUid,
          selectedDate,
          'exact',
          change.timezoneChanged,
        ),
      );
    }

    await Promise.all(tasks);
  }

  private async loadFixtures(
    leagueUid: string,
    date: string,
    mode: GetFixturesPayload['mode'],
    validateSelectedFixture = false,
  ): Promise<void> {
    const requestId = ++this.latestFixtureRequestId;
    fixtureSelectionStore.setState({
      selectedDate: date,
      fixtures: [],
      fixtureStatus: 'loading',
      fixtureError: undefined,
    });

    try {
      const settings = getSettings();
      const localeOverride = toLocaleOverride(settings.locale);
      const timezone = resolveTimezone(settings.timezone);
      const response = await requestFixtures({
        leagueUid,
        date,
        mode,
        timezone,
        ...(localeOverride && { localeOverride }),
      });

      if (requestId !== this.latestFixtureRequestId) return;

      if (!response.ok) {
        fixtureSelectionStore.setState({
          fixtureStatus: 'error',
          fixtureError: response.error,
        });
        return;
      }

      const kickoff = response.data.find((fixture) => fixture.kickoff)?.kickoff;
      const resolvedDate =
        mode === 'exact' || !kickoff ? date : instantToDate(kickoff, timezone);
      const selectedFixtureUid =
        fixtureSelectionStore.getState().selectedFixtureUid;
      const selectedFixture = selectedFixtureUid
        ? response.data.find((fixture) => fixture.uid === selectedFixtureUid)
        : undefined;

      fixtureSelectionStore.setState({
        fixtures: response.data,
        selectedDate: resolvedDate,
        fixtureStatus: 'ready',
        fixtureError: undefined,
        ...(validateSelectedFixture &&
          selectedFixtureUid &&
          !selectedFixture && { selectedFixtureUid: undefined }),
      });

      if (selectedFixture) {
        matchData.updateFixtureInfo(selectedFixture);
      } else if (validateSelectedFixture && selectedFixtureUid) {
        matchData.clearFixture();
      }
    } catch (error) {
      if (requestId !== this.latestFixtureRequestId) return;

      fixtureSelectionStore.setState({
        fixtureStatus: 'error',
        fixtureError:
          error instanceof Error ? error.message : 'Unable to load fixtures',
      });
    }
  }
}

export const fixtureSelectionManager = new FixtureSelectionManager();
