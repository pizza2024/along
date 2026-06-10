import { describe, it, expect, vi } from 'vitest';
import { tickProgress } from '@/hooks/useLongPress';

describe('tickProgress (pure logic)', () => {
  it('at elapsed 0 with duration 800, progress is 0, not done', () => {
    const r = tickProgress(0, 800);
    expect(r.progress).toBe(0);
    expect(r.done).toBe(false);
  });

  it('at elapsed 400 with duration 800, progress is 0.5, not done', () => {
    const r = tickProgress(400, 800);
    expect(r.progress).toBe(0.5);
    expect(r.done).toBe(false);
  });

  it('at elapsed 800 with duration 800, progress is 1, done', () => {
    const r = tickProgress(800, 800);
    expect(r.progress).toBe(1);
    expect(r.done).toBe(true);
  });

  it('at elapsed over duration, progress caps at 1', () => {
    const r = tickProgress(2000, 800);
    expect(r.progress).toBe(1);
    expect(r.done).toBe(true);
  });

  it('short duration works (e.g. 100ms)', () => {
    const r = tickProgress(100, 100);
    expect(r.progress).toBe(1);
    expect(r.done).toBe(true);
  });

  it('simulates a full press sequence via accumulated elapsed', () => {
    // The hook accumulates elapsed in 16ms ticks: simulate 50 ticks of 16ms = 800ms
    let elapsed = 0;
    const events: Array<{ progress: number; done: boolean }> = [];
    for (let i = 0; i < 50; i++) {
      elapsed += 16;
      const r = tickProgress(elapsed, 800);
      events.push(r);
      if (r.done) break;
    }
    // Last event should be done
    expect(events[events.length - 1].done).toBe(true);
    // Should have ~50 ticks (or maybe 49 due to 16*49=784 < 800, 16*50=800)
    expect(events.length).toBeGreaterThanOrEqual(49);
    expect(events.length).toBeLessThanOrEqual(51);
    // First event not done
    expect(events[0].done).toBe(false);
    expect(events[0].progress).toBeLessThan(1);
  });

  it('simulates release before done: progress grows but never reaches 1', () => {
    let elapsed = 0;
    const events: Array<{ progress: number; done: boolean }> = [];
    for (let i = 0; i < 25; i++) {
      elapsed += 16;
      const r = tickProgress(elapsed, 800);
      events.push(r);
      if (r.done) break;
    }
    // 25 ticks = 400ms, half done
    expect(events[events.length - 1].done).toBe(false);
    expect(events[events.length - 1].progress).toBeLessThan(0.6);
  });
});