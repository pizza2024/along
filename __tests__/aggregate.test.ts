import { describe, it, expect } from 'vitest';
import { buildCalendarCells } from '@/utils/aggregate';
import { EMOTIONS } from '@/constants/emotions';
import type { MoodEntry } from '@/types';

function emptyPerEmotion(): Record<string, number> {
  return EMOTIONS.reduce((acc, e) => ({ ...acc, [e.key]: 0 }), {} as Record<string, number>);
}

describe('buildCalendarCells', () => {
  it('returns one cell per day', () => {
    const days = ['2026-06-01', '2026-06-02', '2026-06-03'];
    const cells = buildCalendarCells(days, []);
    expect(cells).toHaveLength(3);
  });

  it('empty cells have count 0 and emotion null', () => {
    const days = ['2026-06-01'];
    const cells = buildCalendarCells(days, []);
    expect(cells[0].count).toBe(0);
    expect(cells[0].emotion).toBeNull();
    expect(cells[0].perEmotion).toEqual(emptyPerEmotion());
  });

  it('counts multiple entries per day', () => {
    const days = ['2026-06-01'];
    const entries: MoodEntry[] = [
      { id: 1, date: '2026-06-01', emotion: 'happy', createdAt: 1 },
      { id: 2, date: '2026-06-01', emotion: 'happy', createdAt: 2 },
      { id: 3, date: '2026-06-01', emotion: 'calm', createdAt: 3 },
    ];
    const cells = buildCalendarCells(days, entries);
    expect(cells[0].count).toBe(3);
    expect(cells[0].emotion).toBe('happy');
    expect(cells[0].perEmotion.happy).toBe(2);
    expect(cells[0].perEmotion.calm).toBe(1);
  });

  it('caps count at 4 for display', () => {
    const days = ['2026-06-01'];
    const entries: MoodEntry[] = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1, date: '2026-06-01', emotion: 'happy', createdAt: i + 1,
    }));
    const cells = buildCalendarCells(days, entries);
    expect(cells[0].count).toBe(4);
  });

  it('dominant emotion on ties goes by EMOTIONS order', () => {
    const days = ['2026-06-01'];
    const entries: MoodEntry[] = [
      { id: 1, date: '2026-06-01', emotion: 'calm', createdAt: 1 },
      { id: 2, date: '2026-06-01', emotion: 'happy', createdAt: 2 },
    ];
    const cells = buildCalendarCells(days, entries);
    // both count=1, happy has order=0 (lower), so happy wins
    expect(cells[0].emotion).toBe('happy');
  });

  it('ignores entries outside the day range', () => {
    const days = ['2026-06-01', '2026-06-02'];
    const entries: MoodEntry[] = [
      { id: 1, date: '2026-05-31', emotion: 'happy', createdAt: 1 },
      { id: 2, date: '2026-06-02', emotion: 'calm', createdAt: 2 },
    ];
    const cells = buildCalendarCells(days, entries);
    expect(cells[0].count).toBe(0);
    expect(cells[0].emotion).toBeNull();
    expect(cells[1].count).toBe(1);
    expect(cells[1].emotion).toBe('calm');
  });

  it('all 8 emotions appear in perEmotion keys', () => {
    const days = ['2026-06-01'];
    const cells = buildCalendarCells(days, []);
    const keys = Object.keys(cells[0].perEmotion);
    expect(keys.sort()).toEqual(['angry','anxious','calm','excited','grateful','happy','sad','tired']);
  });
});
