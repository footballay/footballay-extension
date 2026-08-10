import { X } from "lucide-react";
import { t } from "@/shared/i18n/locale";
import type { LineupViewPlayer } from "@/content/utils/lineupViewModel";
import { getPlayerDetailStats } from "./rightLineupUtils";

type PlayerDetailOverlayProps = {
  onClose: () => void;
  player: LineupViewPlayer;
};

export function PlayerDetailOverlay({ onClose, player }: PlayerDetailOverlayProps) {
  return (
    <div className="footballay-player-detail-overlay" role="dialog" aria-label={player.name}>
      <button className="footballay-player-detail-overlay__backdrop" type="button" onClick={onClose} aria-label={t("content.drawer.player.dismissDetail")} />
      <section className="footballay-player-detail">
        <button className="footballay-player-detail__close" type="button" onClick={onClose} aria-label={t("content.drawer.player.closeDetail")}>
          <X aria-hidden size={15} strokeWidth={2.4} />
        </button>
        <div className="footballay-player-detail__name">
          <strong>{player.name}</strong>
          <span>{player.number ? `#${player.number}` : player.position ?? ""}</span>
        </div>
        <dl>
          {getPlayerDetailStats(player).map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
