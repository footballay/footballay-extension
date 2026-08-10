import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";

type CompactMatchSummaryProps = {
  data: LiveMatchOverlayData | null;
};

export function CompactMatchSummary({ data }: CompactMatchSummaryProps) {
  if (!data) {
    return (
      <section className="footballay-left-drawer__summary footballay-left-drawer__summary--empty">
        {t("content.overlay.waiting.liveData")}
      </section>
    );
  }

  return (
    <section className="footballay-left-drawer__summary">
      <span className="footballay-left-drawer__team">{data.homeTeamName}</span>
      <strong className="footballay-left-drawer__score">
        {data.homeScore} - {data.awayScore}
      </strong>
      <span className="footballay-left-drawer__team">{data.awayTeamName}</span>
      {data.elapsed || data.statusShort ? (
        <em className="footballay-left-drawer__status">
          {data.elapsed ? `${data.elapsed}'` : data.statusShort}
        </em>
      ) : null}
    </section>
  );
}
