import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { LocaleSetting } from '@/shared/settings/settings';

export type ContentLocale = 'ko' | 'en';

const messages = {
  en: {
    league: 'League',
    match: 'Match',
    lineup: 'Lineup',
    statistics: 'Statistics',
    events: 'Events',
    loading: 'Loading data',
    leagueLoading: 'Loading leagues.',
    leagueError: 'Failed to load leagues: {error}',
    retry: 'Retry',
    noLeagues: 'No leagues available.',
    selectLeague: 'Please select a league.',
    fixtureLoading: 'Loading fixtures.',
    fixtureError: 'Failed to load fixtures: {error}',
    noFixtures: 'No fixtures to display.',
    tbd: 'TBD',
    lineupError: 'Failed to load lineup data: {error}',
    noLineup: 'No lineup information.',
    statisticsError: 'Failed to load statistics data: {error}',
    noStatistics: 'No statistics data.',
    eventsError: 'Failed to load events data: {error}',
    substitution: 'Substitution',
    assist: 'Assist',
    openMatchSelector: 'Open match selector',
    close: 'Close',
    previousFixtureDate: 'Previous fixture date',
    fixtureDatePicker: 'Fixture date picker',
    nextFixtureDate: 'Next fixture date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    availableLeagues: 'Available leagues',
    fixtures: 'Fixtures',
    matchPanel: 'Match panel',
    openMatchPanel: 'Open match panel',
    matchPanelTabs: 'Match panel tabs',
    minimizeMatchPanel: 'Minimize match panel',
    lineupTeams: 'Lineup teams',
    lineupPlayers: 'Lineup players',
    matchEventsTimeline: 'Match events timeline',
    substitutedIn: 'Substituted in {time}',
    yellowCard: 'Yellow card',
    redCard: 'Red card',
    goal: 'Goal',
    ownGoal: 'Own goal',
    totalPasses: 'Total Passes',
    passesAccurate: 'Passes Acc',
    possession: 'Possession',
    totalShots: 'Total Shots',
    shotsOnGoal: 'Shots On Goal',
    fouls: 'Fouls',
    cornerKicks: 'Corner Kicks',
    offsides: 'Offsides',
    shotsOffGoal: 'Shots Off Goal',
    blockedShots: 'Blocked Shots',
    shotsInsideBox: 'Shots Inside Box',
    shotsOutsideBox: 'Shots Outside Box',
    goalkeeperSaves: 'Goalkeeper Saves',
    goalsPrevented: 'Goals Prevented',
  },
  ko: {
    league: '리그',
    match: '경기',
    lineup: '라인업',
    statistics: '통계',
    events: '이벤트',
    loading: '데이터 불러오는 중',
    leagueLoading: '리그를 불러오는 중입니다.',
    leagueError: '리그를 불러오지 못했습니다: {error}',
    retry: '다시 시도',
    noLeagues: '사용 가능한 리그가 없습니다.',
    selectLeague: '리그를 선택해주세요.',
    fixtureLoading: '경기를 불러오는 중입니다.',
    fixtureError: '경기를 불러오지 못했습니다: {error}',
    noFixtures: '표시할 경기가 없습니다.',
    tbd: '미정',
    lineupError: '라인업 데이터를 불러오지 못했습니다: {error}',
    noLineup: '라인업 정보가 없습니다.',
    statisticsError: '통계 데이터를 불러오지 못했습니다: {error}',
    noStatistics: '통계 데이터가 없습니다.',
    eventsError: '이벤트 데이터를 불러오지 못했습니다: {error}',
    substitution: '교체',
    assist: '도움',
    openMatchSelector: '매치 선택 열기',
    close: '닫기',
    previousFixtureDate: '이전 경기 날짜',
    fixtureDatePicker: '경기 날짜 선택기',
    nextFixtureDate: '다음 경기 날짜',
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    availableLeagues: '사용 가능한 리그',
    fixtures: '경기',
    matchPanel: '매치 패널',
    openMatchPanel: '매치 패널 열기',
    matchPanelTabs: '매치 패널 탭',
    minimizeMatchPanel: '매치 패널 최소화',
    lineupTeams: '라인업 팀',
    lineupPlayers: '라인업 선수',
    matchEventsTimeline: '경기 이벤트 타임라인',
    substitutedIn: '{time} 교체 투입',
    yellowCard: '옐로카드',
    redCard: '레드카드',
    goal: '골',
    ownGoal: '자책골',
    totalPasses: '총 패스',
    passesAccurate: '정확한 패스',
    possession: '점유율',
    totalShots: '총 슈팅',
    shotsOnGoal: '유효 슈팅',
    fouls: '파울',
    cornerKicks: '코너킥',
    offsides: '오프사이드',
    shotsOffGoal: '빗나간 슈팅',
    blockedShots: '차단된 슈팅',
    shotsInsideBox: '박스 안 슈팅',
    shotsOutsideBox: '박스 밖 슈팅',
    goalkeeperSaves: '골키퍼 선방',
    goalsPrevented: '실점 방지',
  },
} as const;

export type ContentMessageKey = keyof typeof messages.en;

export function t(
  locale: ContentLocale,
  key: ContentMessageKey,
  values: Record<string, string | number> = {},
) {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? ''),
  );
}

export async function resolveContentLocale(
  setting: LocaleSetting,
): Promise<ContentLocale> {
  if (setting !== 'default') return setting;

  try {
    const languages = await globalThis.chrome?.i18n?.getAcceptLanguages?.();
    return (
      languages
        ?.map((language) => language.split('-')[0])
        .find(
          (language): language is ContentLocale =>
            language === 'ko' || language === 'en',
        ) ?? 'en'
    );
  } catch {
    return 'en';
  }
}

const ContentLocaleContext = createContext<ContentLocale>('en');

export function ContentI18nProvider({
  setting,
  children,
}: {
  setting: LocaleSetting;
  children: ReactNode;
}) {
  const [defaultLocale, setDefaultLocale] = useState<ContentLocale>('en');
  const locale = setting === 'default' ? defaultLocale : setting;

  useEffect(() => {
    if (setting !== 'default') return;

    let stale = false;
    setDefaultLocale('en');
    void resolveContentLocale(setting).then((resolvedLocale) => {
      if (!stale) setDefaultLocale(resolvedLocale);
    });
    return () => {
      stale = true;
    };
  }, [setting]);

  return (
    <ContentLocaleContext.Provider value={locale}>
      {children}
    </ContentLocaleContext.Provider>
  );
}

export function useContentLocale() {
  return useContext(ContentLocaleContext);
}
