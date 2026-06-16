import { toDateKey } from './date';

export interface MonthMeta {
  year: number;
  month: number;
  daysInMonth: number;
  firstWeekday: number;
  key: string;
}

export function getMonthMeta(year: number, month: number): MonthMeta {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    year: first.getFullYear(),
    month: first.getMonth(),
    daysInMonth: last.getDate(),
    firstWeekday: first.getDay(),
    key: `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}`,
  };
}

export function getMonthDays(year: number, month: number): string[] {
  const meta = getMonthMeta(year, month);
  const out: string[] = [];
  for (let d = 1; d <= meta.daysInMonth; d++) {
    out.push(toDateKey(new Date(meta.year, meta.month, d)));
  }
  return out;
}

export function getMonthsRange(
  centerYear: number,
  centerMonth: number,
  pastMonths: number,
  futureMonths: number
): MonthMeta[] {
  const result: MonthMeta[] = [];
  for (let offset = -pastMonths; offset <= futureMonths; offset++) {
    const d = new Date(centerYear, centerMonth + offset, 1);
    result.push(getMonthMeta(d.getFullYear(), d.getMonth()));
  }
  return result;
}

export function getMonthSpanDateRange(
  months: MonthMeta[]
): { start: string; end: string } {
  if (months.length === 0) {
    const today = toDateKey(new Date());
    return { start: today, end: today };
  }
  const first = months[0];
  const last = months[months.length - 1];
  return {
    start: toDateKey(new Date(first.year, first.month, 1)),
    end: toDateKey(new Date(last.year, last.month, last.daysInMonth)),
  };
}

export function findMonthIndex(
  months: MonthMeta[],
  year: number,
  month: number
): number {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  return months.findIndex((m) => m.key === key);
}
