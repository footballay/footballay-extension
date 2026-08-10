import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import '@/content/styles/compact-overlay.css';
import type { LiveMatchOverlayData } from '@/domain/live-match/types';
import { defaultSettings } from '@/shared/constants';
import { t } from '@/shared/i18n/locale';
import type { MessageKey } from '@/shared/i18n/messages';
import type { ExtensionSettings, OverlayTickerStatKey } from '@/shared/overlay/types';
import { resolveOverlayTickerStatKeys } from '@/shared/overlay/tickerStats';
import footballayIconSmallUrl from '../../../../assets/footballay_icon_small.png';

type CompactOverlayProps = {
    data: LiveMatchOverlayData | null;
    onCollapse: () => void;
    settings?: ExtensionSettings;
};

type AmbientStat = {
    away?: string | number;
    home?: string | number;
    labelKey: MessageKey;
};

const tickerSizeBase = {
    controlSize: 22,
    fontSize: 16,
    gap: 8,
    glyphSize: 16,
    iconSize: 22,
    minHeight: 30,
    paddingBlock: 3,
    paddingInline: 6,
};

export function CompactOverlay({ data, onCollapse, settings = defaultSettings }: CompactOverlayProps) {
    const statKeys = useMemo(
        () => resolveOverlayTickerStatKeys(settings),
        [settings.overlayTickerCustomStatKeys, settings.overlayTickerStatsMode],
    );
    const stats = useMemo(
        () => getAmbientStats(data, statKeys),
        [data, statKeys],
    );
    const [activeIndex, setActiveIndex] = useState(0);
    const activeStat = stats[activeIndex % stats.length];
    const tickerStyle = useMemo(() => getTickerScaleStyle(settings.overlayTickerScale), [settings.overlayTickerScale]);

    useEffect(() => {
        setActiveIndex(0);
    }, [stats]);

    useEffect(() => {
        if (stats.length <= 1) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % stats.length);
        }, settings.overlayTickerIntervalMs);

        return () => window.clearInterval(timer);
    }, [settings.overlayTickerIntervalMs, stats.length]);

    function showPreviousStat(): void {
        setActiveIndex((currentIndex) => (currentIndex - 1 + stats.length) % stats.length);
    }

    function showNextStat(): void {
        setActiveIndex((currentIndex) => (currentIndex + 1) % stats.length);
    }

    return (
        <section className="footballay-ambient" style={tickerStyle} aria-label={t('content.overlay.aria.ticker')}>
            <div className="footballay-ambient__controls">
                <button
                    className="footballay-ambient__step"
                    type="button"
                    onClick={showPreviousStat}
                    aria-label={t('content.overlay.aria.previousStat')}
                    disabled={stats.length <= 1}
                >
                    <ChevronLeft aria-hidden size={12} strokeWidth={2.4} />
                </button>
                <img className="footballay-ambient__icon" src={footballayIconSmallUrl} alt="" />
                <button
                    className="footballay-ambient__step"
                    type="button"
                    onClick={showNextStat}
                    aria-label={t('content.overlay.aria.nextStat')}
                    disabled={stats.length <= 1}
                >
                    <ChevronRight aria-hidden size={12} strokeWidth={2.4} />
                </button>
            </div>
            <p className="footballay-ambient__line" title={getAmbientTitle(data, activeStat)}>
                <span className="footballay-ambient__stat">{formatAmbientStat(activeStat)}</span>
            </p>
            <button
                className="footballay-ambient__close"
                type="button"
                onClick={onCollapse}
                aria-label={t('content.overlay.aria.hide')}
            >
                <X aria-hidden size={12} strokeWidth={2.4} />
            </button>
        </section>
    );
}

function getAmbientStats(data: LiveMatchOverlayData | null, statKeys: OverlayTickerStatKey[]): AmbientStat[] {
    if (!data) {
        return [{ labelKey: 'content.overlay.waiting.liveData' }];
    }

    const stats = statKeys.map((statKey) => getAmbientStat(data, statKey));
    const availableStats = stats.filter((stat) => stat.home !== undefined || stat.away !== undefined);

    return availableStats.length ? availableStats : [{ labelKey: 'content.overlay.waiting.matchStats' }];
}

function getAmbientStat(data: LiveMatchOverlayData, statKey: OverlayTickerStatKey): AmbientStat {
    if (statKey === 'expectedGoals') {
        return {
            away: data.awayStats?.expectedGoals,
            home: data.homeStats?.expectedGoals,
            labelKey: 'overlay.stat.expectedGoals',
        };
    }

    if (statKey === 'possession') {
        return {
            away: data.awayStats?.possession,
            home: data.homeStats?.possession,
            labelKey: 'overlay.stat.possession',
        };
    }

    if (statKey === 'shotsOnGoal') {
        return {
            away: data.awayStats?.shotsOnGoal,
            home: data.homeStats?.shotsOnGoal,
            labelKey: 'overlay.stat.shotsOnGoal',
        };
    }

    if (statKey === 'shotsTotal') {
        return {
            away: data.awayStats?.shotsTotal,
            home: data.homeStats?.shotsTotal,
            labelKey: 'overlay.stat.shots',
        };
    }

    if (statKey === 'shotsInsideBox') {
        return {
            away: data.awayStats?.shotsInsideBox,
            home: data.homeStats?.shotsInsideBox,
            labelKey: 'overlay.stat.shotsInsideBox',
        };
    }

    if (statKey === 'cornerKicks') {
        return {
            away: data.awayStats?.cornerKicks,
            home: data.homeStats?.cornerKicks,
            labelKey: 'overlay.stat.cornerKicks',
        };
    }

    if (statKey === 'passesAccuracy') {
        return {
            away: formatPercentage(data.awayStats?.passesAccuracyPercentage),
            home: formatPercentage(data.homeStats?.passesAccuracyPercentage),
            labelKey: 'overlay.stat.passesAccuracy',
        };
    }

    if (statKey === 'fouls') {
        return {
            away: data.awayStats?.fouls,
            home: data.homeStats?.fouls,
            labelKey: 'overlay.stat.fouls',
        };
    }

    if (statKey === 'offsides') {
        return {
            away: data.awayStats?.offsides,
            home: data.homeStats?.offsides,
            labelKey: 'overlay.stat.offsides',
        };
    }

    if (statKey === 'goalkeeperSaves') {
        return {
            away: data.awayStats?.goalkeeperSaves,
            home: data.homeStats?.goalkeeperSaves,
            labelKey: 'overlay.stat.goalkeeperSaves',
        };
    }

    return {
        away: formatCards(data.awayStats?.yellowCards, data.awayStats?.redCards),
        home: formatCards(data.homeStats?.yellowCards, data.homeStats?.redCards),
        labelKey: 'overlay.stat.cards',
    };
}

function formatAmbientStat(stat?: AmbientStat): string {
    if (!stat) {
        return t('content.overlay.waiting.liveData');
    }

    if (stat.home === undefined && stat.away === undefined) {
        return t(stat.labelKey);
    }

    return `${t(stat.labelKey)} ${stat.home ?? '-'} - ${stat.away ?? '-'}`;
}

function formatPercentage(value?: number): string | undefined {
    return value === undefined ? undefined : `${value}%`;
}

function formatCards(yellowCards?: number, redCards?: number): string | undefined {
    if (yellowCards === undefined && redCards === undefined) {
        return undefined;
    }

    return redCards && redCards > 0 ? `${yellowCards ?? 0}Y ${redCards}R` : `${yellowCards ?? 0}`;
}

function getAmbientTitle(data: LiveMatchOverlayData | null, stat?: AmbientStat): string {
    if (!data || !stat) {
        return t('content.overlay.title.liveStats');
    }

    return `${data.homeTeamName} vs ${data.awayTeamName}: ${formatAmbientStat(stat)}`;
}

function getTickerScaleStyle(scale: number): CSSProperties {
    return {
        '--footballay-ambient-control-size': `${tickerSizeBase.controlSize * scale}px`,
        '--footballay-ambient-font-size': `${tickerSizeBase.fontSize * scale}px`,
        '--footballay-ambient-gap': `${tickerSizeBase.gap * scale}px`,
        '--footballay-ambient-glyph-size': `${tickerSizeBase.glyphSize * scale}px`,
        '--footballay-ambient-icon-size': `${tickerSizeBase.iconSize * scale}px`,
        '--footballay-ambient-min-height': `${tickerSizeBase.minHeight * scale}px`,
        '--footballay-ambient-padding-block': `${tickerSizeBase.paddingBlock * scale}px`,
        '--footballay-ambient-padding-inline': `${tickerSizeBase.paddingInline * scale}px`,
    } as CSSProperties;
}
