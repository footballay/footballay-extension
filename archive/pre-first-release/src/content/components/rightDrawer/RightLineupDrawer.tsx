import "@/content/styles/side-drawer.css";
import "@/content/styles/right-lineup-drawer.css";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import { buildTeamLineupViewModel } from "@/content/utils/lineupViewModel";
import { LineupTeamSection } from "./LineupTeamSection";
import { PlayerDetailOverlay } from "./PlayerDetailOverlay";
import { findSelectedPlayer } from "./rightLineupUtils";

type RightLineupDrawerProps = {
  data: LiveMatchOverlayData | null;
  onClearSelectedPlayer: () => void;
  onSelectPlayer: (matchPlayerUid: string) => void;
  selectedPlayerUid?: string;
};

export function RightLineupDrawer({
  data,
  onClearSelectedPlayer,
  onSelectPlayer,
  selectedPlayerUid
}: RightLineupDrawerProps) {
  const homeLineup = buildTeamLineupViewModel(data, "home");
  const awayLineup = buildTeamLineupViewModel(data, "away");
  const selectedPlayer = findSelectedPlayer([homeLineup, awayLineup], selectedPlayerUid);

  return (
    <aside className="footballay-side-drawer footballay-side-drawer--right" aria-label={t("content.drawer.right.title")}>
      {homeLineup || awayLineup ? (
        <div className="footballay-lineup-drawer">
          <LineupTeamSection lineup={homeLineup} onSelectPlayer={onSelectPlayer} selectedPlayerUid={selectedPlayerUid} />
          <LineupTeamSection lineup={awayLineup} onSelectPlayer={onSelectPlayer} selectedPlayerUid={selectedPlayerUid} />
        </div>
      ) : (
        <p className="footballay-empty">{t("content.drawer.empty.lineup")}</p>
      )}

      {selectedPlayer ? (
        <PlayerDetailOverlay player={selectedPlayer} onClose={onClearSelectedPlayer} />
      ) : null}
    </aside>
  );
}
