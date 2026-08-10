import type { TeamLineupViewModel } from "@/content/utils/lineupViewModel";
import { LineupPlayerButton } from "./LineupPlayerButton";

type LineupTeamSectionProps = {
  lineup: TeamLineupViewModel | null;
  onSelectPlayer: (matchPlayerUid: string) => void;
  selectedPlayerUid?: string;
};

export function LineupTeamSection({ lineup, onSelectPlayer, selectedPlayerUid }: LineupTeamSectionProps) {
  if (!lineup) {
    return null;
  }

  return (
    <section className="footballay-lineup-team">
      <div className="footballay-lineup-team__title">
        <strong>{lineup.teamName}</strong>
        {lineup.formation ? <span>{lineup.formation}</span> : null}
      </div>
      <div className="footballay-lineup-pitch">
        {lineup.rows.map((row, rowIndex) => (
          <div className="footballay-lineup-row" key={`${lineup.teamName}-${rowIndex}`}>
            {row.map((player) => (
              <LineupPlayerButton
                key={player.matchPlayerUid}
                player={player}
                selectedPlayerUid={selectedPlayerUid}
                onSelectPlayer={onSelectPlayer}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
