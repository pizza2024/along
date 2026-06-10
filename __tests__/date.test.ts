import { describe, it, expect } from 'vitest';
import { toDateKey, last30Days } from '@/utils/date';

describe('toDateKey', () => {
  it('formats YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 5, 10))).toBe('2026-06-10');
  });
  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('last30Days', () => {
  it('returns 30 entries', () => {
    const days = last30Days(new Date(2026, 5, 10));
    expect(days).toHaveLength(30);
  });
  it('last entry is today', () => {
    const days = last30Days(new Date(2026, 5, 10));
    expect(days[29]).toBe('2026-06-10');
  });
  it('first entry is 29 days before', () => {
    const days = last30Days(new Date(2026, 5, 10));
    expect(days[0]).toBe('2026-05-12');
  });
  it('crosses month boundary correctly', () => {
    const days = last30Days(new Date(2026, 6, 5));
    expect(days[29]).toBe('2026-07-05');
    expect(days[0]).toBe('2026-06-06');
  });
  it('entries are in chronological order ascending', () => {
    const days = last30Days(new Date(2026, 5, 10));
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i-1]).toBe(true);
    }
  });
});