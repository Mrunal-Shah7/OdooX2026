/** Calendar dates as YYYY-MM-DD strings. No timezone conversion. */

export function toDateOnly(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function monthBounds(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { start, end };
}

/**
 * Returns ISO weekday: 1 = Monday ... 7 = Sunday
 */
export function getIsoWeekday(dateStr: string): number {
  const date = parseDateOnly(dateStr);
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Returns an inclusive list of YYYY-MM-DD strings between startDate and endDate.
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (start.getTime() > end.getTime()) {
    return [];
  }

  const result: string[] = [];
  const current = new Date(start.getTime());

  while (current.getTime() <= end.getTime()) {
    result.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

/**
 * Checks if a date falls within [startDate, endDate ?? infinity]
 */
export function isDateInRange(dateStr: string, startDate: string, endDate?: string | null): boolean {
  if (dateStr < startDate) return false;
  if (endDate && dateStr > endDate) return false;
  return true;
}

/**
 * Adds (or subtracts) a number of days to a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateOnly(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the difference in calendar days (endDate - startDate).
 */
export function diffInDays(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validates YYYY-MM-DD format.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = parseDateOnly(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateStr;
}
