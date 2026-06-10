import { describe, it, expect } from 'vitest';
import { EMOTIONS, EMOTION_MAP } from '@/constants/emotions';
import type { EmotionKey } from '@/types';

describe('EMOTIONS', () => {
  it('has exactly 8 emotions', () => {
    expect(EMOTIONS).toHaveLength(8);
  });
  it('all keys are unique', () => {
    const keys = EMOTIONS.map(e => e.key);
    expect(new Set(keys).size).toBe(8);
  });
  it('order values are 0-7', () => {
    const orders = EMOTIONS.map(e => e.order).sort((a,b) => a-b);
    expect(orders).toEqual([0,1,2,3,4,5,6,7]);
  });
  it('all colors are valid 6-digit hex', () => {
    for (const e of EMOTIONS) {
      expect(e.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
  it('all labels are non-empty strings', () => {
    for (const e of EMOTIONS) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });
});

describe('EMOTION_MAP', () => {
  it('contains every EmotionKey', () => {
    const expected: EmotionKey[] = ['happy','calm','grateful','excited','anxious','sad','angry','tired'];
    for (const k of expected) {
      expect(EMOTION_MAP[k]).toBeDefined();
      expect(EMOTION_MAP[k].key).toBe(k);
    }
  });
});