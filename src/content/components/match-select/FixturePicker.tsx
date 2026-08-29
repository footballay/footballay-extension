import { useEffect, useState } from 'react';
import { useFixtureSelection } from '@/content/features/fixture-selection';
import {
  addDateMonths,
  calendarGridDates,
  dateDay,
  dateMonth,
  startOfDateMonth,
  todayInTimezone,
} from '@/content/utils/date';
import { t, useContentLocale } from '@/shared/i18n/content';

type FixturePickerProps = {
  view: 'Match' | 'DatePicker';
  onDateSelect: () => void;
};

export function FixturePicker({ view, onDateSelect }: FixturePickerProps) {
  const locale = useContentLocale();
  const {
    timezone,
    fixtures,
    fixtureDates,
    fixtureStatus,
    fixtureError,
    selectedLeagueUid,
    selectedDate,
    selectedFixtureUid,
    selectDate,
    selectFixture,
    loadFixtureDates,
  } = useFixtureSelection();
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfDateMonth(selectedDate ?? todayInTimezone(timezone)),
  );

  useEffect(() => {
    if (view !== 'DatePicker') {
      setCalendarMonth(
        startOfDateMonth(selectedDate ?? todayInTimezone(timezone)),
      );
    }
  }, [selectedDate, timezone, view]);

  useEffect(() => {
    if (view === 'DatePicker') void loadFixtureDates(calendarMonth);
  }, [calendarMonth, loadFixtureDates, timezone, view]);

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
            onClick={() => setCalendarMonth((date) => addDateMonths(date, -1))}
          >
            <span className="footballay-caret footballay-caret--left" />
          </button>
          <span>
            {calendarMonth.slice(0, 4)}.{' '}
            {String(dateMonth(calendarMonth)).padStart(2, '0')}
          </span>
          <button
            type="button"
            aria-label={t(locale, 'nextMonth')}
            onClick={() => setCalendarMonth((date) => addDateMonths(date, 1))}
          >
            <span className="footballay-caret footballay-caret--right" />
          </button>
        </div>
        <div className="footballay-calendar-grid">
          {calendarGridDates(calendarMonth).map((value) => {
            const day = dateDay(value);
            const month = dateMonth(value);
            const isToday = value === todayInTimezone(timezone);
            const hasFixture = fixtureDates.includes(value);
            const label = day === 1 ? `${month}/${day}` : String(day);

            return (
              <button
                key={value}
                className={`footballay-date-block${hasFixture ? ' footballay-date-block--fixture' : ''}${isToday && !hasFixture ? ' footballay-date-block--today' : ''}`}
                type="button"
                aria-pressed={value === selectedDate}
                onClick={() => {
                  onDateSelect();
                  void selectDate(value);
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
                  timeZone: timezone,
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
