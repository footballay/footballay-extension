import { t } from "@/shared/i18n/locale";
import { findLineupPlayer, flattenLineupPlayers, type LineupViewPlayer, type TeamLineupViewModel } from "@/content/utils/lineupViewModel";

export function getVisiblePlayer(player: LineupViewPlayer): LineupViewPlayer {
  return player.playerSubstitute ? getVisiblePlayer(player.playerSubstitute) : player;
}

export function findSelectedPlayer(
  lineups: Array<TeamLineupViewModel | null>,
  selectedPlayerUid?: string
): LineupViewPlayer | undefined {
  for (const lineup of lineups) {
    const player = findLineupPlayer(lineup?.players ?? [], selectedPlayerUid);

    if (player) {
      return player;
    }
  }

  return selectedPlayerUid ? lineups.flatMap((lineup) => flattenLineupPlayers(lineup?.players ?? []))[0] : undefined;
}

export function getPlayerDetailStats(player: LineupViewPlayer): Array<{ label: string; value: string | number }> {
  return [
    { label: t("content.drawer.player.rating"), value: player.rating?.toFixed(1) ?? "-" },
    { label: t("content.drawer.player.minutes"), value: player.minutesPlayed ?? "-" },
    { label: t("content.drawer.player.goals"), value: player.goals || "-" },
    { label: t("content.drawer.player.assists"), value: player.assists || "-" },
    { label: t("content.drawer.player.shots"), value: formatPair(player.shotsOn, player.shots) },
    { label: t("content.drawer.player.passes"), value: formatPasses(player) },
    { label: t("content.drawer.player.keyPasses"), value: player.passesKey ?? "-" },
    { label: t("content.drawer.player.tackles"), value: player.tacklesTotal ?? "-" },
    { label: t("content.drawer.player.interceptions"), value: player.interceptions ?? "-" },
    { label: t("content.drawer.player.duels"), value: formatPair(player.duelsWon, player.duelsTotal) },
    { label: t("content.drawer.player.fouls"), value: formatPair(player.foulsCommitted, player.foulsDrawn) }
  ];
}

function formatPair(left?: number, right?: number): string {
  if (left === undefined && right === undefined) {
    return "-";
  }

  return `${left ?? 0}/${right ?? 0}`;
}

function formatPasses(player: LineupViewPlayer): string {
  if (player.passesTotal === undefined && player.passesAccuracy === undefined) {
    return player.passes ?? "-";
  }

  return `${player.passesAccuracy ?? 0}/${player.passesTotal ?? 0}`;
}
