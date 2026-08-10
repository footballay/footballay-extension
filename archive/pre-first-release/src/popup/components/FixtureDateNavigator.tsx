import { useEffect, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale/ko";
import { CalendarDays, CalendarSync, ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/shared/i18n/locale";
import { getTodayDateInputValue, toDateInputValue } from "../utils/date";
import { formatSelectedDate } from "../utils/format";

type FixtureDateDirection = "previous" | "next";

type FixtureDateNavigatorProps = {
  disabled: boolean;
  fixtureDate?: string;
  selectedFixtureDate?: string;
  onNavigate: (direction: FixtureDateDirection) => void;
  onReturnToSelectedFixtureDate: () => void;
  onSelectDate: (fixtureDate?: string) => void;
};

export function FixtureDateNavigator({
  disabled,
  fixtureDate,
  selectedFixtureDate,
  onNavigate,
  onReturnToSelectedFixtureDate,
  onSelectDate
}: FixtureDateNavigatorProps) {
  const currentFixtureDate = fixtureDate ?? getTodayDateInputValue();
  const selectedDate = parseDateInputValue(currentFixtureDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  const canReturnToSelectedFixtureDate =
    !disabled && Boolean(selectedFixtureDate) && selectedFixtureDate !== currentFixtureDate;

  useEffect(() => {
    setDisplayMonth(selectedDate);
  }, [selectedDate.getTime()]);

  useEffect(() => {
    if (!calendarOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [calendarOpen]);

  function selectDate(date: Date): void {
    onSelectDate(toDateInputValue(date));
    setCalendarOpen(false);
  }

  function selectToday(): void {
    selectDate(new Date());
  }

  function goToPreviousMonth(): void {
    setDisplayMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  function goToNextMonth(): void {
    setDisplayMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  function returnToSelectedFixtureDate(): void {
    onReturnToSelectedFixtureDate();
    setCalendarOpen(false);
  }

  return (
    <div className="footballay-date-nav">
      <button
        className="footballay-date-nav-button footballay-date-nav-button--previous"
        type="button"
        aria-label={t("popup.fixture.nav.previousDate")}
        disabled={disabled}
        onClick={() => onNavigate("previous")}
      >
        <ChevronLeft aria-hidden size={24} strokeWidth={3} />
      </button>
      <div
        ref={calendarRef}
        className={`footballay-date-picker${disabled ? " footballay-date-picker--loading" : ""}`}
      >
        <button
          className="footballay-date-trigger"
          type="button"
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={() => setCalendarOpen((open) => !open)}
        >
          <span>{formatSelectedDate(fixtureDate)}</span>
          {disabled ? <i aria-hidden className="footballay-date-spinner" /> : null}
          <CalendarDays aria-hidden size={22} strokeWidth={2.4} />
        </button>
        {calendarOpen ? (
          <div className="footballay-calendar-popover" role="dialog" aria-label={t("popup.fixture.datePicker.title")}>
            <div className="footballay-calendar-header">
              <button type="button" aria-label={t("popup.fixture.datePicker.previousMonth")} onClick={goToPreviousMonth}>
                <ChevronLeft aria-hidden size={18} strokeWidth={2.6} />
              </button>
              <strong>{formatCalendarMonth(displayMonth)}</strong>
              <button type="button" aria-label={t("popup.fixture.datePicker.nextMonth")} onClick={goToNextMonth}>
                <ChevronRight aria-hidden size={18} strokeWidth={2.6} />
              </button>
              <button className="footballay-calendar-action" type="button" onClick={selectToday}>
                {t("popup.fixture.datePicker.today")}
              </button>
              {canReturnToSelectedFixtureDate ? (
                <button
                  className="footballay-calendar-action footballay-calendar-action--icon"
                  type="button"
                  aria-label={t("popup.fixture.datePicker.returnToSelected")}
                  onClick={returnToSelectedFixtureDate}
                >
                  <CalendarSync aria-hidden size={15} strokeWidth={2.4} />
                </button>
              ) : null}
            </div>
            <DayPicker
              mode="single"
              selected={selectedDate}
              month={displayMonth}
              hideNavigation
              locale={ko}
              onMonthChange={setDisplayMonth}
              onSelect={(date) => {
                if (date) {
                  selectDate(date);
                }
              }}
            />
          </div>
        ) : null}
      </div>
      <button
        className="footballay-date-nav-button footballay-date-nav-button--next"
        type="button"
        aria-label={t("popup.fixture.nav.nextDate")}
        disabled={disabled}
        onClick={() => onNavigate("next")}
      >
        <ChevronRight aria-hidden size={24} strokeWidth={3} />
      </button>
    </div>
  );
}

function parseDateInputValue(dateInputValue: string): Date {
  return new Date(`${dateInputValue}T00:00:00`);
}

function formatCalendarMonth(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
