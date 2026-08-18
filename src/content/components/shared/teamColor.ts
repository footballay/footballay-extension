import Color from 'colorjs.io';

type TeamColorSource = {
  playerColor: {
    primary: string;
    secondary?: string | null;
    number: string;
    border: string | null;
  } | null;
};

const MINIMUM_COLOR_DISTANCE = 20;
const FALLBACK_COLORS = [
  '#3cbeff',
  '#f4f451',
  '#3ddb97',
  '#7a5cff',
  '#ff9e57',
] as const;

function normalizeColor(color?: string | null): string | undefined {
  const value = color?.trim();
  const normalized = value?.startsWith('#') ? value : `#${value}`;
  if (
    !value ||
    !/^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8})$/i.test(normalized)
  )
    return undefined;
  return normalized;
}

function colorCandidates(team?: TeamColorSource) {
  const color = team?.playerColor;
  return [color?.primary, color?.secondary ?? color?.number, color?.border]
    .map(normalizeColor)
    .filter((value): value is string => Boolean(value));
}

function pickColor(team: TeamColorSource | undefined, reference?: string) {
  const candidates = [...colorCandidates(team), ...FALLBACK_COLORS];
  return (
    candidates.find(
      (candidate) =>
        !reference ||
        Color.deltaE(candidate, reference, '2000') >= MINIMUM_COLOR_DISTANCE,
    ) ?? FALLBACK_COLORS[0]
  );
}

export function resolveTeamColors(
  home?: TeamColorSource,
  away?: TeamColorSource,
) {
  const homeColor = pickColor(home);
  return { home: homeColor, away: pickColor(away, homeColor) };
}
