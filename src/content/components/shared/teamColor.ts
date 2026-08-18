export function teamColor(
  team: { playerColor: { primary: string } | null },
  fallback: string,
): string {
  const color = team.playerColor?.primary.trim();
  if (!color) return fallback;
  if (/^#[\da-f]{3,8}$/i.test(color)) return color;
  return /^[\da-f]{3,8}$/i.test(color) ? `#${color}` : fallback;
}
