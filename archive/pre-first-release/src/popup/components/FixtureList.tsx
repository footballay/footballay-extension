import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { FixtureSummary } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import { formatFixtureScore, formatFixtureStatus, formatKickoffTime } from "../utils/format";

type FixtureListProps = {
  fixtures: FixtureSummary[];
  loadingText: string | null;
  selectedFixtureUid?: string;
  selectedLeagueUid?: string;
  onSelectFixture: (fixtureUid: string) => void;
};

type FakeScrollbarState = {
  visible: boolean;
  thumbHeight: number;
  thumbOffset: number;
};

const MIN_SCROLL_THUMB_HEIGHT = 28;
const FAKE_SCROLLBAR_BOTTOM_INSET = 8;

export function FixtureList({
  fixtures,
  loadingText,
  selectedFixtureUid,
  selectedLeagueUid,
  onSelectFixture
}: FixtureListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollbar, setScrollbar] = useState<FakeScrollbarState>({
    visible: false,
    thumbHeight: MIN_SCROLL_THUMB_HEIGHT,
    thumbOffset: 0
  });

  const updateScrollbar = useCallback(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = list;
    const scrollableDistance = scrollHeight - clientHeight;
    const trackHeight = Math.max(0, clientHeight - FAKE_SCROLLBAR_BOTTOM_INSET);

    if (clientHeight <= 0 || trackHeight <= 0 || scrollableDistance <= 1) {
      setScrollbar((current) =>
        current.visible
          ? { visible: false, thumbHeight: MIN_SCROLL_THUMB_HEIGHT, thumbOffset: 0 }
          : current
      );
      return;
    }

    const thumbHeight = Math.max(
      MIN_SCROLL_THUMB_HEIGHT,
      Math.round((clientHeight / scrollHeight) * trackHeight)
    );
    const maxThumbOffset = trackHeight - thumbHeight;
    const thumbOffset = Math.round((scrollTop / scrollableDistance) * maxThumbOffset);

    setScrollbar((current) => {
      if (
        current.visible &&
        current.thumbHeight === thumbHeight &&
        current.thumbOffset === thumbOffset
      ) {
        return current;
      }

      return {
        visible: true,
        thumbHeight,
        thumbOffset
      };
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollbar);
    const list = listRef.current;

    if (!list) {
      return () => window.cancelAnimationFrame(frame);
    }

    const resizeObserver = new ResizeObserver(updateScrollbar);
    resizeObserver.observe(list);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [fixtures.length, loadingText, selectedLeagueUid, updateScrollbar]);

  return (
    <div className="footballay-fixture-list-shell">
      <div ref={listRef} className="footballay-fixture-list" aria-label={t("popup.fixtures.aria.list")} onScroll={updateScrollbar}>
        {loadingText && !fixtures.length ? (
          <p className="footballay-empty-state">{loadingText}</p>
        ) : !selectedLeagueUid ? (
          <p className="footballay-empty-state">{t("popup.fixture.empty.noLeague")}</p>
        ) : fixtures.length ? (
          fixtures.map((fixture) => {
            const selected = fixture.uid === selectedFixtureUid;

            return (
              <article
                key={fixture.uid}
                className={`footballay-fixture-row${selected ? " footballay-fixture-row--selected" : ""}`}
              >
                <div className="footballay-fixture-row__meta">
                  <span className="footballay-fixture-time">{formatKickoffTime(fixture.kickoff)}</span>
                  <span className="footballay-fixture-status">{formatFixtureStatus(fixture)}</span>
                  <span className="footballay-fixture-round">{fixture.round}</span>
                </div>

                <div className="footballay-fixture-row__body">
                  <strong className="footballay-fixture-team footballay-fixture-team--home">
                    {fixture.homeTeamName}
                  </strong>
                  <strong className="footballay-fixture-score">{formatFixtureScore(fixture)}</strong>
                  <strong className="footballay-fixture-team footballay-fixture-team--away">
                    {fixture.awayTeamName}
                  </strong>
                  <button
                    className="footballay-fixture-action"
                    type="button"
                    aria-label={selected ? t("popup.fixture.action.selected") : t("popup.fixture.action.select")}
                    onClick={() => onSelectFixture(fixture.uid)}
                  >
                    {selected ? <Check aria-hidden size={18} strokeWidth={3} /> : <Plus aria-hidden size={18} strokeWidth={3} />}
                    <span>{selected ? t("popup.fixture.actionLabel.selected") : t("popup.fixture.actionLabel.select")}</span>
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="footballay-empty-state">{t("popup.fixture.empty.noFixtures")}</p>
        )}
      </div>

      {scrollbar.visible ? (
        <div className="footballay-fixture-fake-scrollbar" aria-hidden>
          <div
            className="footballay-fixture-fake-scrollbar__thumb"
            style={{
              height: `${scrollbar.thumbHeight}px`,
              transform: `translateY(${scrollbar.thumbOffset}px)`
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
