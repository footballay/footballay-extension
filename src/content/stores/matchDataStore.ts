import { create } from 'zustand';
import {
  requestMatchData,
  type MatchDataDto,
} from '@/shared/footballayApiProtocol';
import type { LoadStatus } from './matchPickerStore';

export type MatchData = {
  fixtureUid: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  elapsed?: number | null;
  status: string;
  lineup: MatchDataDto['lineup']['lineup'];
  events: MatchDataDto['events']['events'];
  statistics: MatchDataDto['statistics'];
};

type MatchDataStore = {
  data?: MatchData;
  status: LoadStatus;
  error?: string;
  clearMatchData: () => void;
  loadMatchData: (fixtureUid: string) => Promise<void>;
};

let latestRequestId = 0;

export const useMatchDataStore = create<MatchDataStore>((set) => ({
  status: 'idle',
  clearMatchData: () => {
    ++latestRequestId;
    set({ data: undefined, status: 'idle', error: undefined });
  },
  loadMatchData: async (fixtureUid) => {
    const requestId = ++latestRequestId;
    set({ data: undefined, status: 'loading', error: undefined });

    try {
      const response = await requestMatchData(fixtureUid);
      if (requestId !== latestRequestId) return;
      if (!response.ok) {
        set({ status: 'error', error: response.error });
        return;
      }

      set({
        data: mapMatchData(response.data),
        status: 'ready',
        error: undefined,
      });
    } catch (error) {
      if (requestId !== latestRequestId) return;
      set({
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Unable to load match data',
      });
    }
  },
}));

function mapMatchData(data: MatchDataDto): MatchData {
  return {
    fixtureUid: data.info.fixtureUid,
    homeTeamName: data.info.home?.koreanName ?? data.info.home?.name ?? 'Home',
    awayTeamName: data.info.away?.koreanName ?? data.info.away?.name ?? 'Away',
    homeScore: data.status.liveStatus.score.home ?? 0,
    awayScore: data.status.liveStatus.score.away ?? 0,
    elapsed: data.status.liveStatus.elapsed,
    status: data.status.liveStatus.shortStatus,
    lineup: data.lineup.lineup,
    events: data.events.events,
    statistics: data.statistics,
  };
}
