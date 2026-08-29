import type {
  FixtureEventsDto,
  FixtureStatisticsDto,
  MatchEventDto,
  MatchPlayerColorDto,
} from '@/shared/api/dto';
import { resolveTeamColors } from '../util/teamColor';

export type DisplayEvent = MatchEventDto & {
  kind: 'goal' | 'card' | 'substitution';
  displayTime: string;
  timelineValue: number;
};

export type EventsTeamView = {
  teamUid: string;
  name: string;
  playerColor: MatchPlayerColorDto | null;
  color: string;
};

export type EventsViewModel = {
  events: DisplayEvent[];
  home?: EventsTeamView;
  away?: EventsTeamView;
  max: 90 | 120;
};

type TeamSource = {
  teamUid: string;
  name: string;
  playerColor: MatchPlayerColorDto | null;
};

function eventKind(event: MatchEventDto): DisplayEvent['kind'] | undefined {
  if (event.type === 'Goal') return 'goal';
  // 교체 이벤트에서는 player가 IN, assist가 OUT을 의미한다.
  if (event.type === 'Subst') return 'substitution';
  if (/card/i.test(event.type) || /card/i.test(event.detail)) return 'card';
}

function displayTime(event: MatchEventDto) {
  return `${event.elapsed}${event.extraTime ? `+${event.extraTime}` : ''}'`;
}

export function matchMinuteToTimelineValue(
  elapsed: number,
  extraTime: number | null,
) {
  if (elapsed > 90) return elapsed;
  if (extraTime === null) return elapsed;
  return elapsed <= 45 ? 45 : 90;
}

export function timelineMax(events: readonly { elapsed: number }[]): 90 | 120 {
  return events.some((event) => event.elapsed > 90) ? 120 : 90;
}

function teamView(
  team: TeamSource | undefined,
  color: string,
): EventsTeamView | undefined {
  if (!team) return undefined;
  return { ...team, color };
}

export function buildEventsViewModel(
  events: FixtureEventsDto | undefined,
  statistics: FixtureStatisticsDto | undefined,
): EventsViewModel {
  const displayEvents = (events?.events ?? []).flatMap((event) => {
    if (event.elapsed < 0) return [];
    const kind = eventKind(event);
    if (!kind) return [];
    return [
      {
        ...event,
        kind,
        displayTime: displayTime(event),
        timelineValue: matchMinuteToTimelineValue(
          event.elapsed,
          event.extraTime,
        ),
      },
    ];
  });
  const homeSource = statistics?.home?.team ?? displayEvents[0]?.team;
  const awaySource =
    statistics?.away?.team ??
    displayEvents.find((event) => event.team.teamUid !== homeSource?.teamUid)
      ?.team;
  const colors = resolveTeamColors(homeSource, awaySource);

  return {
    events: displayEvents,
    home: teamView(homeSource, colors.home),
    away: teamView(awaySource, colors.away),
    max: timelineMax(displayEvents),
  };
}
