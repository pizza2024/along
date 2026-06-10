import { describe, it, expect } from 'vitest';
import {
  getMonthMeta,
  getMonthDays,
  getMonthsRange,
  getMonthSpanDateRange,
  findMonthIndex,
} from '@/utils/month';

describe('getMonthMeta', () => {
  it('returns correct daysInMonth for a 31-day month', () => {
    const m = getMonthMeta(2026, 6);
    expect(m.daysInMonth).toBe(31);
  });
  it('returns correct daysInMonth for a 30-day month', () => {
    const m = getMonthMeta(2026, 5);
    expect(m.daysInMonth).toBe(30);
  });
  it('returns correct daysInMonth for February non-leap', () => {
    const m = getMonthMeta(2025, 1);
    expect(m.daysInMonth).toBe(28);
  });
  it('returns correct daysInMonth for February leap year', () => {
    const m = getMonthMeta(2024, 1);
    expect(m.daysInMonth).toBe(29);
  });
  it('returns firstWeekday as 0-6', () => {
    const m = getMonthMeta(2026, 5);
    expect(m.firstWeekday).toBeGreaterThanOrEqual(0);
    expect(m.firstWeekday).toBeLessThanOrEqual(6);
  });
  it('formats key as YYYY-MM with zero-padded month', () => {
    expect(getMonthMeta(2026, 0).key).toBe('2026-01');
    expect(getMonthMeta(2026, 11).key).toBe('2026-12');
  });
  it('handles month overflow', () => {
    const m = getMonthMeta(2026, 12);
    expect(m.year).toBe(2027);
    expect(m.month).toBe(0);
  });
  it('handles month underflow', () => {
    const m = getMonthMeta(2026, -1);
    expect(m.year).toBe(2025);
    expect(m.month).toBe(11);
  });
});

describe('getMonthDays', () => {
  it('returns one date key per day in the month', () => {
    const days = getMonthDays(2026, 5);
    expect(days).toHaveLength(30);
    expect(days[0]).toBe('2026-06-01');
    expect(days[29]).toBe('2026-06-30');
  });
  it('handles February leap year', () => {
    const days = getMonthDays(2024, 1);
    expect(days).toHaveLength(29);
    expect(days[28]).toBe('2024-02-29');
  });
  it('keys are in ascending order', () => {
    const days = getMonthDays(2026, 0);
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true);
    }
  });
});

describe('getMonthsRange', () => {
  it('returns pastMonths + 1 + futureMonths items', () => {
    const range = getMonthsRange(2026, 5, 3, 2);
    expect(range).toHaveLength(6);
  });
  it('center sits at index = pastMonths', () => {
    const range = getMonthsRange(2026, 5, 3, 2);
    expect(range[3].key).toBe('2026-06');
  });
  it('crosses year boundary downward', () => {
    const range = getMonthsRange(2026, 1, 3, 0);
    expect(range[0].key).toBe('2025-11');
    expect(range[3].key).toBe('2026-02');
  });
  it('crosses year boundary upward', () => {
    const range = getMonthsRange(2026, 10, 0, 3);
    expect(range[0].key).toBe('2026-11');
    expect(range[3].key).toBe('2027-02');
  });
  it('returns just the center when both bounds are 0', () => {
    const range = getMonthsRange(2026, 5, 0, 0);
    expect(range).toHaveLength(1);
    expect(range[0].key).toBe('2026-06');
  });
});

describe('getMonthSpanDateRange', () => {
  it('returns first day of first month and last day of last month', () => {
    const range = getMonthsRange(2026, 5, 1, 1);
    const span = getMonthSpanDateRange(range);
    expect(span.start).toBe('2026-05-01');
    expect(span.end).toBe('2026-07-31');
  });
  it('handles single month', () => {
    const range = getMonthsRange(2026, 5, 0, 0);
    const span = getMonthSpanDateRange(range);
    expect(span.start).toBe('2026-06-01');
    expect(span.end).toBe('2026-06-30');
  });
});

describe('findMonthIndex', () => {
  it('finds existing month', () => {
    const range = getMonthsRange(2026, 5, 3, 2);
    expect(findMonthIndex(range, 2026, 5)).toBe(3);
    expect(findMonthIndex(range, 2026, 7)).toBe(5);
    expect(findMonthIndex(range, 2026, 2)).toBe(0);
  });
  it('returns -1 when not found', () => {
    const range = getMonthsRange(2026, 5, 1, 1);
    expect(findMonthIndex(range, 2020, 0)).toBe(-1);
  });
});
