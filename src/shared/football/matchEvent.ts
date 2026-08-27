import type { MatchEventDto } from '@/shared/api/dto';

export type MatchEventKind = 'goal' | 'missed-penalty' | 'other';

export function getMatchEventKind(event: MatchEventDto): MatchEventKind {
  if (event.type === 'Goal') return 'goal';
  if (event.type === 'ETC' && event.detail === 'Missed Penalty')
    return 'missed-penalty';
  return 'other';
}
