function dateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return { year: year!, month: month!, day: day! };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDate(value: string) {
  const { year, month, day } = dateParts(value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDateDays(value: string, days: number) {
  const date = utcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function addDateMonths(value: string, months: number) {
  const { year, month } = dateParts(value);
  return formatDate(new Date(Date.UTC(year, month - 1 + months, 1)));
}

export function startOfDateMonth(value: string) {
  const { year, month } = dateParts(value);
  return formatDate(new Date(Date.UTC(year, month - 1, 1)));
}

export function calendarRange(value: string) {
  const monthStart = startOfDateMonth(value);
  const start = utcDate(monthStart);
  return {
    startDate: addDateDays(monthStart, -start.getUTCDay()),
    endDate: addDateDays(monthStart, 41 - start.getUTCDay()),
  };
}

export function calendarGridDates(value: string) {
  const { startDate } = calendarRange(value);
  return Array.from({ length: 42 }, (_, index) =>
    addDateDays(startDate, index),
  );
}

export function dateMonth(value: string) {
  return dateParts(value).month;
}

export function dateDay(value: string) {
  return dateParts(value).day;
}

function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInTimezone(timezone: string, now = new Date()) {
  return dateInTimezone(now, timezone);
}

export function instantToDate(value: string, timezone: string) {
  return dateInTimezone(new Date(value), timezone);
}
