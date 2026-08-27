export type FixtureStatusGroup =
  'upcoming' | 'playing' | 'paused' | 'finished' | 'not-played' | 'unknown';

export function getFixtureStatusGroup(status: string): FixtureStatusGroup {
  if (['TBD', 'NS'].includes(status)) return 'upcoming';
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(status)) return 'playing';
  if (['HT', 'BT', 'SUSP', 'INT'].includes(status)) return 'paused';
  if (['FT', 'AET', 'PEN'].includes(status)) return 'finished';
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status)) return 'not-played';
  return 'unknown';
}
