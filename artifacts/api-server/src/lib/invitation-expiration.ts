const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  januari: 1,
  februari: 2,
  mac: 3,
  mei: 5,
  jun: 6,
  julai: 7,
  ogos: 8,
  oktober: 10,
  disember: 12,
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function isValidCalendarDate({ year, month, day }: CalendarDate) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= lastDay;
}

function parseEventDate(value: string | null | undefined): CalendarDate | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;

  let match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const date = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
    return isValidCalendarDate(date) ? date : null;
  }

  match = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const date = {
      year: Number(match[3]),
      month: Number(match[2]),
      day: Number(match[1]),
    };
    return isValidCalendarDate(date) ? date : null;
  }

  match = normalized.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (match) {
    const date = {
      year: Number(match[3]),
      month: MONTHS[match[2]],
      day: Number(match[1]),
    };
    return isValidCalendarDate(date) ? date : null;
  }

  return null;
}

function addMonths(date: CalendarDate, months: number): CalendarDate {
  const zeroBasedMonth = date.month - 1 + months;
  const year = date.year + Math.floor(zeroBasedMonth / 12);
  const month = ((zeroBasedMonth % 12) + 12) % 12 + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    day: Math.min(date.day, lastDay),
  };
}

function compareCalendarDates(left: CalendarDate, right: CalendarDate) {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

function todayUtc(): CalendarDate {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

/**
 * Invitations expire after the event date plus three calendar months.
 * Invalid or legacy-empty dates are treated as non-expiring because there is
 * no safe date from which to calculate an expiration boundary.
 */
export function isInvitationExpired(eventDate: string | null | undefined, today = todayUtc()) {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return false;
  return compareCalendarDates(today, addMonths(parsed, 3)) > 0;
}

/**
 * Editing is locked from the day after the paid invitation's event date.
 * This is separate from public invitation expiration, which happens three
 * months later.
 */
export function isEventDatePassed(eventDate: string | null | undefined, today = todayUtc()) {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return false;
  return compareCalendarDates(today, parsed) > 0;
}
