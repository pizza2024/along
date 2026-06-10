import { describe, it, expect } from 'vitest';
import { resolveCellColor } from '@/utils/resolveCellColor';
import { EMOTION_MAP } from '@/constants/emotions';
import type { CalendarCell, EmotionKey } from '@/types';

function makeCell(overrides: Partial<CalendarCell> = {}): CalendarCell {
  const basePer: Record<EmotionKey, number> = {
    happy: 0, calm: 0, grateful: 0, excited: 0,
    anxious: 0, sad: 0, angry: 0, tired: 0,
  };
  return {
    date: '2026-06-10',
    count: 0,
    emotion: null,
    perEmotion: basePer,
    ...overrides,
  };
}

describe('resolveCellColor', () => {
  it('aggregate mode with empty cell returns empty gray', () => {
    const cell = makeCell();
    expect(resolveCellColor(cell, 'aggregate', 'happy')).toBe('#F2F2F2');
  });

  it('aggregate mode uses cell.emotion and cell.count', () => {
    const cell = makeCell({ emotion: 'happy', count: 2 });
    expect(resolveCellColor(cell, 'aggregate', 'calm'))
      .toBe('rgba(245,197,24,0.45)');
  });

  it('aggregate mode caps at 4 (alpha 1.0)', () => {
    const cell = makeCell({ emotion: 'happy', count: 4 });
    expect(resolveCellColor(cell, 'aggregate', 'calm'))
      .toBe('rgba(245,197,24,1)');
  });

  it('single mode: empty perEmotion returns gray', () => {
    const cell = makeCell();
    expect(resolveCellColor(cell, 'single', 'happy')).toBe('#F2F2F2');
  });

  it('single mode uses selected emotion count', () => {
    const cell = makeCell({ perEmotion: { ...makeCell().perEmotion, calm: 3 } });
    expect(resolveCellColor(cell, 'single', 'calm'))
      .toBe('rgba(127,191,127,0.78)');
  });

  it('single mode: if selected emotion count is 0, returns gray even if other emotions have counts', () => {
    const cell = makeCell({ perEmotion: { ...makeCell().perEmotion, happy: 5 } });
    expect(resolveCellColor(cell, 'single', 'calm')).toBe('#F2F2F2');
  });

  it('single mode uses correct color from EMOTION_MAP for various emotions', () => {
    const cell = makeCell({ perEmotion: { ...makeCell().perEmotion, sad: 1 } });
    expect(resolveCellColor(cell, 'single', 'sad'))
      .toBe(`rgba(74,111,165,0.18)`);
  });
});