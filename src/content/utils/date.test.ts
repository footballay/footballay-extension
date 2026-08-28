import { describe, expect, it } from 'vitest';
import {
  addDateDays,
  addDateMonths,
  calendarRange,
  instantToDate,
  todayInTimezone,
} from './date';

describe('date utilities', () => {
  it('keeps date-only arithmetic and calendar ranges independent of host timezone', () => {
    expect(addDateDays('2026-08-28', 1)).toBe('2026-08-29');
    expect(addDateDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDateMonths('2026-01-31', 1)).toBe('2026-02-01');
    expect(calendarRange('2026-08-22')).toEqual({
      startDate: '2026-07-26',
      endDate: '2026-09-05',
    });
  });

  it('projects instants and today into the selected timezone', () => {
    const instant = '2026-08-28T23:30:00Z';

    expect(instantToDate(instant, 'Asia/Seoul')).toBe('2026-08-29');
    expect(instantToDate(instant, 'America/Los_Angeles')).toBe('2026-08-28');
    expect(todayInTimezone('Asia/Seoul', new Date(instant))).toBe('2026-08-29');
  });
});
