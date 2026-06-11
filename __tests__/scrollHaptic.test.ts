import { describe, it, expect } from 'vitest';
import { shouldFireScrollHaptic } from '@/utils/scrollHaptic';

describe('shouldFireScrollHaptic (pure logic)', () => {
  it('returns false when prev index is null (first scroll event)', () => {
    expect(shouldFireScrollHaptic(null, 0, 1000, null)).toBe(false);
  });

  it('returns false when index did not change', () => {
    expect(shouldFireScrollHaptic(3, 3, 1000, null)).toBe(false);
  });

  it('returns true on first index change with no prior haptic', () => {
    expect(shouldFireScrollHaptic(0, 1, 1000, null)).toBe(true);
  });

  it('returns true on first index change with a prior haptic outside throttle window', () => {
    expect(shouldFireScrollHaptic(0, 1, 1000, 800, 80)).toBe(true);
  });

  it('returns false when last haptic is within the throttle window', () => {
    expect(shouldFireScrollHaptic(0, 1, 1000, 950, 80)).toBe(false);
  });

  it('throttle is inclusive at the exact boundary (now - last === throttle)', () => {
    expect(shouldFireScrollHaptic(0, 1, 1080, 1000, 80)).toBe(true);
  });

  it('throttle blocks one millisecond under the boundary', () => {
    expect(shouldFireScrollHaptic(0, 1, 1079, 1000, 80)).toBe(false);
  });

  it('works symmetrically for backward scrolls (index decreases)', () => {
    expect(shouldFireScrollHaptic(5, 4, 2000, null)).toBe(true);
  });

  it('default throttle is 80ms when not specified', () => {
    expect(shouldFireScrollHaptic(0, 1, 1000, 950)).toBe(false);
    expect(shouldFireScrollHaptic(0, 1, 1080, 1000)).toBe(true);
  });

  it('simulates fast flick: only ~12 haptics per second fire', () => {
    let fired = 0;
    let lastHaptic: number | null = null;
    let prev = 0;
    // 5 months in 800ms
    for (let t = 0; t <= 800; t += 16) {
      const curr = Math.min(5, Math.floor(t / 160));
      if (shouldFireScrollHaptic(prev, curr, t, lastHaptic)) {
        fired++;
        lastHaptic = t;
      }
      prev = curr;
    }
    // 800ms / 80ms throttle = 10 max, with snap cadence adding a few
    expect(fired).toBeGreaterThan(0);
    expect(fired).toBeLessThanOrEqual(11);
  });
});
