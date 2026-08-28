import { useEffect, useState } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { toDateInputValue } from '@/content/utils/date';
import { t, useContentLocale } from '@/shared/i18n/content';

type FixturePickerProps = {
  view: 'Match' | 'DatePicker';
  onDateSelect: () => void;
};

export function FixturePicker({ view, onDateSelect }: FixturePickerProps) {
  const locale = useContentLocale();
  const fixtures = useMatchPickerStore((state) => state.fixtures);
  const fixtureDates = useMatchPickerStore((state) => state.fixtureDates);
  const fixtureStatus = useMatchPickerStore((state) => state.fixtureStatus);
  const fixtureError = useMatchPickerStore((state) => state.fixtureError);
  const selectedLeagueUid = useMatchPickerStore(
    (state) => state.selectedLeagueUid,
  );
  const selectedDate = useMatchPickerStore((state) => state.selectedDate);
  const selectedFixtureUid = useMatchPickerStore(
    (state) => state.selectedFixtureUid,
  );
  const selectDateAndLoadFixtures = useMatchPickerStore(
    (state) => state.selectDateAndLoadFixtures,
  );
  const selectFixture = useMatchPickerStore((state) => state.selectFixture);
  const loadFixtureDates = useMatchPickerStore(
    (state) => state.loadFixtureDates,
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(),
  );

  useEffect(() => {
    if (view !== 'DatePicker') {
      setCalendarMonth(
        selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(),
      );
    }
  }, [selectedDate, view]);

  useEffect(() => {
    if (view === 'DatePicker')
      void loadFixtureDates(toDateInputValue(calendarMonth));
  }, [calendarMonth, loadFixtureDates, view]);

  if (!selectedLeagueUid) {
    return view === 'Match' ? (
      <section
        className="footballay-fixture-section"
        aria-label={t(locale, 'fixtures')}
      >
        <p className="footballay-content-status">{t(locale, 'selectLeague')}</p>
      </section>
    ) : null;
  }

  const calendarStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  );
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  if (view === 'DatePicker') {
    return (
      <div
        className="footballay-calendar"
        role="dialog"
        aria-label={t(locale, 'fixtureDatePicker')}
      >
        <div className="footballay-calendar-month">
          <button
            type="button"
            aria-label={t(locale, 'previousMonth')}
            onClick={() =>
              setCalendarMonth(
                (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1),
              )
            }
          >
            <span className="footballay-caret footballay-caret--left" />
          </button>
          <span>
            {calendarMonth.getFullYear()}.{' '}
            {String(calendarMonth.getMonth() + 1).padStart(2, '0')}
          </span>
          <button
            type="button"
            aria-label={t(locale, 'nextMonth')}
            onClick={() =>
              setCalendarMonth(
                (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1),
              )
            }
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
            const hasFixture = fixtureDates.includes(value);
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
                onClick={() => {
                  onDateSelect();
                  void selectDateAndLoadFixtures(value);
                }}
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
    <section
      className="footballay-fixture-section"
      aria-label={t(locale, 'fixtures')}
    >
      {fixtureStatus === 'loading' && (
        <p className="footballay-content-status" role="status">
          {t(locale, 'fixtureLoading')}
        </p>
      )}
      {fixtureStatus === 'error' && (
        <p className="footballay-content-status" role="alert">
          {t(locale, 'fixtureError', { error: fixtureError ?? '' })}
        </p>
      )}
      {fixtureStatus === 'ready' && fixtures.length === 0 && (
        <p className="footballay-content-status">{t(locale, 'noFixtures')}</p>
      )}
      {fixtures.length > 0 && (
        <div
          className="footballay-fixture-list"
          role="listbox"
          aria-label={t(locale, 'fixtures')}
        >
          {fixtures.map((fixture) => {
            const homeTeamName = fixture.homeTeam?.name ?? t(locale, 'tbd');
            const awayTeamName = fixture.awayTeam?.name ?? t(locale, 'tbd');
            const kickoff = fixture.kickoff
              ? new Intl.DateTimeFormat(locale, {
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
