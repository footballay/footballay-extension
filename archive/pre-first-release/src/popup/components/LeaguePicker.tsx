import type { AvailableLeague } from "@/domain/live-match/types";
import { getLeagueLabel } from "../utils/format";

type LeaguePickerProps = {
  leagues: AvailableLeague[];
  selectedLeagueUid?: string;
  onSelectLeague: (leagueUid: string) => void;
};

export function LeaguePicker({ leagues, selectedLeagueUid, onSelectLeague }: LeaguePickerProps) {
  return (
    <section className="footballay-league-section">
      <div className="footballay-league-strip" role="listbox" aria-label="Leagues">
        {leagues.map((league) => {
          const selected = league.uid === selectedLeagueUid;

          return (
            <button
              key={league.uid}
              className={`footballay-league-card${selected ? " footballay-league-card--selected" : ""}`}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectLeague(league.uid)}
            >
              {getLeagueLabel(league)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
