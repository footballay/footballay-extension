import "@/content/styles/side-drawer.css";
import "@/content/styles/left-match-drawer.css";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import { OverlayDivider } from "../overlayControls/OverlayDivider";
import { CompactMatchSummary } from "./CompactMatchSummary";
import { MatchEventsTimeline } from "./MatchEventsTimeline";
import { MatchStatsPanel } from "./MatchStatsPanel";

type LeftMatchDrawerProps = {
  data: LiveMatchOverlayData | null;
};

export function LeftMatchDrawer({ data }: LeftMatchDrawerProps) {
  return (
    <aside className="footballay-side-drawer footballay-side-drawer--left" aria-label={t("content.drawer.left.title")}>
      <div className="footballay-left-drawer">
        <CompactMatchSummary data={data} />
        <OverlayDivider />
        <section className="footballay-left-drawer__section" aria-label={t("content.drawer.stats.title")}>
          <MatchStatsPanel data={data} />
        </section>
        <OverlayDivider />
        <section className="footballay-left-drawer__section" aria-label={t("content.drawer.events.title")}>
          <MatchEventsTimeline data={data} />
        </section>
      </div>
    </aside>
  );
}
