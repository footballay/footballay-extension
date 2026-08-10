import type { CSSProperties } from "react";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import { OverlayDivider } from "../overlayControls/OverlayDivider";

type MatchStatsPanelProps = {
  data: LiveMatchOverlayData | null;
};

type RatioStatRow = {
  away?: number;
  home?: number;
  label: string;
  valueFormatter?: (value: number) => string;
};

type StatStyle = CSSProperties & Record<"--footballay-away-color" | "--footballay-home-color", string>;
type DonutStyle = CSSProperties & Record<"--footballay-donut-color" | "--footballay-donut-percent", string>;
type BarStyle = CSSProperties & Record<"--footballay-away-percent" | "--footballay-home-percent", string>;

const fallbackHomeColor = "#b91c2f";
const fallbackAwayColor = "#1d4ed8";

export function MatchStatsPanel({ data }: MatchStatsPanelProps) {
  if (!data) {
    return <p className="footballay-empty">{t("content.drawer.empty.stats")}</p>;
  }

  const rows = getRatioStatRows(data);
  const hasPassAccuracy =
    data.homeStats?.passesAccuracyPercentage !== undefined ||
    data.awayStats?.passesAccuracyPercentage !== undefined;

  if (!rows.length && !hasPassAccuracy) {
    return <p className="footballay-empty">{t("content.drawer.empty.stats")}</p>;
  }

  const homeColor = data.homeTeamColor?.primary ?? fallbackHomeColor;
  const awayColor = data.awayTeamColor?.primary ?? fallbackAwayColor;
  const style: StatStyle = {
    "--footballay-away-color": awayColor,
    "--footballay-home-color": homeColor
  };

  return (
    <div className="footballay-visual-stats" style={style}>
      {hasPassAccuracy ? (
        <section className="footballay-visual-stats__pass">
          <h3>{t("overlay.stat.passesAccuracy")}</h3>
          <div className="footballay-visual-stats__donuts">
            <PassAccuracyDonut color={homeColor} value={data.homeStats?.passesAccuracyPercentage} />
            <PassAccuracyDonut color={awayColor} value={data.awayStats?.passesAccuracyPercentage} />
          </div>
        </section>
      ) : null}

      {rows.length ? (
        <>
          <OverlayDivider />
          <section className="footballay-visual-stats__main">
            <h3>{t("content.drawer.stats.major")}</h3>
            <div className="footballay-visual-stats__bars">
              {rows.map((row) => (
                <RatioStatBar key={row.label} row={row} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function PassAccuracyDonut({ color, value }: { color: string; value?: number }) {
  const percent = clampPercent(value ?? 0);
  const style: DonutStyle = {
    "--footballay-donut-color": color,
    "--footballay-donut-percent": `${percent}%`
  };

  return (
    <div className="footballay-pass-donut" style={style}>
      <span>{value === undefined ? "-" : `${Math.round(percent)}%`}</span>
    </div>
  );
}

function RatioStatBar({ row }: { row: RatioStatRow }) {
  const homeValue = row.home ?? 0;
  const awayValue = row.away ?? 0;
  const homePercent = getHomeRatioPercent(homeValue, awayValue);
  const awayPercent = 100 - homePercent;
  const style: BarStyle = {
    "--footballay-away-percent": `${awayPercent}%`,
    "--footballay-home-percent": `${homePercent}%`
  };
  const formatValue = row.valueFormatter ?? formatNumber;

  return (
    <div className="footballay-stat-ratio">
      <span className="footballay-stat-ratio__label">{row.label}</span>
      <div className="footballay-stat-ratio__body">
        <span className="footballay-stat-ratio__value">
          {row.home === undefined ? "-" : formatValue(row.home)}
        </span>
        <div className="footballay-stat-ratio__bar" style={style} aria-hidden>
          <span className="footballay-stat-ratio__bar-home" />
          <span className="footballay-stat-ratio__bar-away" />
        </div>
        <span className="footballay-stat-ratio__value footballay-stat-ratio__value--away">
          {row.away === undefined ? "-" : formatValue(row.away)}
        </span>
      </div>
    </div>
  );
}

function getRatioStatRows(data: LiveMatchOverlayData): RatioStatRow[] {
  return [
    {
      label: t("overlay.stat.possession"),
      home: parsePercentage(data.homeStats?.possession),
      away: parsePercentage(data.awayStats?.possession),
      valueFormatter: (value: number) => `${formatNumber(value)}%`
    },
    {
      label: t("overlay.stat.expectedGoals"),
      home: parseNumber(data.homeStats?.expectedGoals),
      away: parseNumber(data.awayStats?.expectedGoals)
    },
    {
      label: t("overlay.stat.shots"),
      home: data.homeStats?.shotsTotal,
      away: data.awayStats?.shotsTotal
    },
    {
      label: t("overlay.stat.shotsOnGoal"),
      home: data.homeStats?.shotsOnGoal,
      away: data.awayStats?.shotsOnGoal
    },
    {
      label: t("overlay.stat.cornerKicks"),
      home: data.homeStats?.cornerKicks,
      away: data.awayStats?.cornerKicks
    },
    {
      label: t("overlay.stat.offsides"),
      home: data.homeStats?.offsides,
      away: data.awayStats?.offsides
    },
    {
      label: t("overlay.stat.fouls"),
      home: data.homeStats?.fouls,
      away: data.awayStats?.fouls
    },
    {
      label: t("overlay.stat.yellowCards"),
      home: data.homeStats?.yellowCards,
      away: data.awayStats?.yellowCards
    },
    {
      label: t("overlay.stat.redCards"),
      home: data.homeStats?.redCards,
      away: data.awayStats?.redCards
    },
    {
      label: t("overlay.stat.goalkeeperSaves"),
      home: data.homeStats?.goalkeeperSaves,
      away: data.awayStats?.goalkeeperSaves
    }
  ].filter((row) => row.home !== undefined || row.away !== undefined);
}

function getHomeRatioPercent(homeValue: number, awayValue: number): number {
  const total = homeValue + awayValue;
  return total > 0 ? (homeValue / total) * 100 : 50;
}

function parsePercentage(value?: string): number | undefined {
  return parseNumber(value?.replace("%", ""));
}

function parseNumber(value?: string | number): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
}
