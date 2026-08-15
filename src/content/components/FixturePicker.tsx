import { useMatchPickerStore } from '@/content/stores/matchPickerStore';

function toDateInputValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

type FixturePickerProps = {
  view: 'Match' | 'DatePicker';
};

export function FixturePicker({ view }: FixturePickerProps) {
  const fixtures = useMatchPickerStore((state) => state.fixtures);
  const fixtureStatus = useMatchPickerStore((state) => state.fixtureStatus);
  const fixtureError = useMatchPickerStore((state) => state.fixtureError);
  const selectedLeagueUid = useMatchPickerStore(
    (state) => state.selectedLeagueUid,
  );
  const selectedDate = useMatchPickerStore((state) => state.selectedDate);
  const selectedFixtureUid = useMatchPickerStore(
    (state) => state.selectedFixtureUid,
  );
  const navigateFixtureDate = useMatchPickerStore(
    (state) => state.navigateFixtureDate,
  );
  const selectDateAndLoadFixtures = useMatchPickerStore(
    (state) => state.selectDateAndLoadFixtures,
  );
  const selectFixture = useMatchPickerStore((state) => state.selectFixture);

  if (!selectedLeagueUid) return null;

  const selectedCalendarDate = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : new Date();
  const calendarStart = new Date(
    selectedCalendarDate.getFullYear(),
    selectedCalendarDate.getMonth(),
    1,
  );
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  if (view === 'DatePicker') {
    return (
      <div
        className="footballay-calendar"
        role="dialog"
        aria-label="Fixture date picker"
      >
        <div className="footballay-calendar-month">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => void navigateFixtureDate('previous')}
          >
            <span className="footballay-caret footballay-caret--left" />
          </button>
          <span>
            {selectedCalendarDate.getFullYear()}.{' '}
            {String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => void navigateFixtureDate('next')}
          >
            <span className="footballay-caret footballay-caret--right" />
          </button>
        </div>
        <div className="footballay-calendar-grid">
          {Array.from({ length: 42 }, (_, index) => {
            const date = new Date(calendarStart);
            date.setDate(calendarStart.getDate() + index);
            const value = toDateInputValue(date);
            const isToday = value === toDateInputValue(new Date());
            const hasFixture = fixtures.some((fixture) =>
              fixture.kickoff?.startsWith(value),
            );
            const label =
              date.getDate() === 1
                ? `${date.getMonth() + 1}/${date.getDate()}`
                : String(date.getDate());

            return (
              <button
                key={value}
                className={`footballay-date-block${hasFixture ? ' footballay-date-block--fixture' : ''}${isToday && !hasFixture ? ' footballay-date-block--today' : ''}`}
                type="button"
                aria-pressed={value === selectedDate}
                onClick={() => void selectDateAndLoadFixtures(value)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="footballay-fixture-section" aria-label="Fixtures">
      {fixtureStatus === 'loading' && (
        <p className="footballay-content-status" role="status">
          경기를 불러오는 중입니다.
        </p>
      )}
      {fixtureStatus === 'error' && (
        <p className="footballay-content-status" role="alert">
          경기를 불러오지 못했습니다: {fixtureError}
        </p>
      )}
      {fixtureStatus === 'ready' && fixtures.length === 0 && (
        <p className="footballay-content-status">표시할 경기가 없습니다.</p>
      )}
      {fixtures.length > 0 && (
        <div
          className="footballay-fixture-list"
          role="listbox"
          aria-label="Fixtures"
        >
          {fixtures.map((fixture) => {
            const homeTeamName =
              fixture.homeTeam?.nameKo ?? fixture.homeTeam?.name ?? 'TBD';
            const awayTeamName =
              fixture.awayTeam?.nameKo ?? fixture.awayTeam?.name ?? 'TBD';
            const kickoff = fixture.kickoff
              ? new Intl.DateTimeFormat('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }).format(new Date(fixture.kickoff))
              : '--:--';

            return (
              <button
                key={fixture.uid}
                className={`footballay-fixture-button${fixture.uid === selectedFixtureUid ? ' footballay-fixture-button--selected' : ''}`}
                type="button"
                aria-pressed={fixture.uid === selectedFixtureUid}
                onClick={() => selectFixture(fixture.uid)}
              >
                <span>{kickoff}</span>
                <strong>{homeTeamName}</strong>
                <strong>{awayTeamName}</strong>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
