import { t } from "@/shared/i18n/locale";
import type { LineupViewPlayer } from "@/content/utils/lineupViewModel";
import { PlayerMarker } from "./LineupPlayerMarkers";
import { getVisiblePlayer } from "./rightLineupUtils";

type LineupPlayerButtonProps = {
  onSelectPlayer: (matchPlayerUid: string) => void;
  player: LineupViewPlayer;
  selectedPlayerUid?: string;
};

export function LineupPlayerButton({ onSelectPlayer, player, selectedPlayerUid }: LineupPlayerButtonProps) {
  const activePlayer = getVisiblePlayer(player);

  return (
    <span className="footballay-lineup-player-slot">
      <button
        className={`footballay-lineup-player${
          selectedPlayerUid === activePlayer.matchPlayerUid ? " footballay-lineup-player--selected" : ""
        }`}
        type="button"
        onClick={() => onSelectPlayer(activePlayer.matchPlayerUid)}
      >
        <span className="footballay-lineup-player__content">
          <PlayerMarker player={activePlayer} />
          <span className="footballay-lineup-player__name">
            {activePlayer.captain ? (
              <span className="footballay-lineup-player__captain" aria-label={t("content.drawer.player.captain")}>
                C
              </span>
            ) : null}
            {activePlayer.name}
          </span>
        </span>
      </button>
    </span>
  );
}
