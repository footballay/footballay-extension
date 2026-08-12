import { useState } from 'react';
import { DayPicker } from '@daypicker/react';
import { ko } from '@daypicker/react/locale/ko';
import '@daypicker/react/style.css';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';

function toDateInputValue(date: Date): string {
    const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

export function FixturePicker() {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const fixtures = useMatchPickerStore((state) => state.fixtures);
    const fixtureStatus = useMatchPickerStore((state) => state.fixtureStatus);
    const fixtureError = useMatchPickerStore((state) => state.fixtureError);
    const selectedLeagueUid = useMatchPickerStore((state) => state.selectedLeagueUid);
    const selectedDate = useMatchPickerStore((state) => state.selectedDate);
    const selectedFixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
    const navigateFixtureDate = useMatchPickerStore((state) => state.navigateFixtureDate);
    const selectDateAndLoadFixtures = useMatchPickerStore((state) => state.selectDateAndLoadFixtures);
    const selectFixture = useMatchPickerStore((state) => state.selectFixture);

    if (!selectedLeagueUid) return null;

    return (
        <section className="footballay-fixture-section" aria-label="Fixtures">
            <strong className="footballay-fixture-title">경기</strong>
            <div className="footballay-fixture-date-navigation">
                <button
                    type="button"
                    aria-label="Previous fixture date"
                    disabled={fixtureStatus === 'loading'}
                    onClick={() => void navigateFixtureDate('previous')}
                >
                    &lt;
                </button>
                <button
                    type="button"
                    className="footballay-fixture-date-button"
                    aria-label="Fixture date"
                    aria-haspopup="dialog"
                    aria-expanded={calendarOpen}
                    disabled={fixtureStatus === 'loading'}
                    onClick={() => setCalendarOpen((open) => !open)}
                >
                    {selectedDate}
                </button>
                <button
                    type="button"
                    aria-label="Next fixture date"
                    disabled={fixtureStatus === 'loading'}
                    onClick={() => void navigateFixtureDate('next')}
                >
                    &gt;
                </button>
                {calendarOpen && (
                    <div className="footballay-fixture-calendar" role="dialog" aria-label="Fixture date picker">
                        <DayPicker
                            mode="single"
                            locale={ko}
                            selected={selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined}
                            onSelect={(date) => {
                                if (!date) return;
                                setCalendarOpen(false);
                                void selectDateAndLoadFixtures(toDateInputValue(date));
                            }}
                        />
                    </div>
                )}
            </div>
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
                <div className="footballay-fixture-list" role="listbox" aria-label="Fixtures">
                    {fixtures.map((fixture) => {
                        const homeTeamName = fixture.homeTeam?.nameKo ?? fixture.homeTeam?.name ?? 'TBD';
                        const awayTeamName = fixture.awayTeam?.nameKo ?? fixture.awayTeam?.name ?? 'TBD';
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
                                <span>
                                    {kickoff} · {fixture.status.shortStatus}
                                </span>
                                <strong>
                                    {homeTeamName} {fixture.score.home ?? '-'} : {fixture.score.away ?? '-'}{' '}
                                    {awayTeamName}
                                </strong>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
