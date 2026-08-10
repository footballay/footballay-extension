import { ArrowUp } from "lucide-react";
import { t } from "@/shared/i18n/locale";
import type { LineupViewPlayer } from "@/content/utils/lineupViewModel";
import goalMarkerUrl from "../../../../assets/goal_marker.png";

export function PlayerMarker({ player }: { player: LineupViewPlayer }) {
  return (
    <span className="footballay-lineup-player__marker">
      {player.substitutedIn ? (
        <span className="footballay-lineup-player__sub-in" aria-label={t("content.drawer.player.substitutedIn")}>
          <ArrowUp aria-hidden size={10} strokeWidth={2.6} />
        </span>
      ) : null}
      <PlayerCards player={player} />
      {player.rating !== undefined ? (
        <span className="footballay-lineup-player__rating">{player.rating.toFixed(1)}</span>
      ) : null}
      <PlayerGoals player={player} />
      <span className="footballay-lineup-player__number">{player.number ?? "-"}</span>
    </span>
  );
}

function PlayerCards({ player }: { player: LineupViewPlayer }) {
  if (!player.yellowCards && !player.redCards) {
    return null;
  }

  const cardClassName = player.redCards
    ? "footballay-lineup-player__card footballay-lineup-player__card--red"
    : "footballay-lineup-player__card";
  const cardLabel = player.redCards
    ? t("content.drawer.player.redCard")
    : t("content.drawer.player.yellowCard");

  return (
    <span className="footballay-lineup-player__cards">
      <span className={cardClassName} aria-label={cardLabel} />
    </span>
  );
}

function PlayerGoals({ player }: { player: LineupViewPlayer }) {
  if (!player.goals && !player.ownGoals) {
    return null;
  }

  return (
    <span className="footballay-lineup-player__goals">
      {Array.from({ length: player.goals }).map((_, index) => (
        <span key={`goal-${index}`} className="footballay-lineup-player__goal" aria-label={t("content.drawer.player.goal")}>
          <img src={goalMarkerUrl} alt="" />
        </span>
      ))}
      {Array.from({ length: player.ownGoals }).map((_, index) => (
        <span key={`own-goal-${index}`} className="footballay-lineup-player__goal footballay-lineup-player__goal--own" aria-label={t("content.drawer.player.ownGoal")}>
          <img src={goalMarkerUrl} alt="" />
        </span>
      ))}
    </span>
  );
}
