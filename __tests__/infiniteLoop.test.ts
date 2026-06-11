import { describe, it, expect } from 'vitest';
import { computeInfiniteWrap, buildInfiniteRows } from '@/utils/infiniteLoop';

describe('computeInfiniteWrap (pure logic)', () => {
  const copyLen = 8;
  const step = 96; // buttonSize 88 + gap 8
  const padding = 12;

  it('does not wrap when sitting in the middle copy (B)', () => {
    // idx 8 = first of B, offset = 12 + 8*96 = 780
    const r = computeInfiniteWrap(780, copyLen, step, padding);
    expect(r.needsWrap).toBe(false);
    expect(r.nextIdx).toBe(8);
  });

  it('does not wrap in the middle of B (idx 12)', () => {
    const r = computeInfiniteWrap(12 + 12 * 96, copyLen, step, padding);
    expect(r.needsWrap).toBe(false);
    expect(r.nextIdx).toBe(12);
  });

  it('wraps A → C: idx 0 of A becomes idx 16 of C', () => {
    const r = computeInfiniteWrap(padding + 0 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(16);
    expect(r.nextOffset).toBe(padding + 16 * step);
  });

  it('wraps A → C: idx 5 of A becomes idx 21 of C', () => {
    const r = computeInfiniteWrap(padding + 5 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(21);
    expect(r.nextOffset).toBe(padding + 21 * step);
  });

  it('wraps A → C: last item of A (idx 7) becomes last item of C (idx 23)', () => {
    const r = computeInfiniteWrap(padding + 7 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(23);
    expect(r.nextOffset).toBe(padding + 23 * step);
  });

  it('wraps C → A: idx 16 of C becomes idx 0 of A', () => {
    const r = computeInfiniteWrap(padding + 16 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(0);
    expect(r.nextOffset).toBe(padding + 0 * step);
  });

  it('wraps C → A: last item of C (idx 23) becomes last item of A (idx 7)', () => {
    const r = computeInfiniteWrap(padding + 23 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(7);
  });

  it('boundary: idx 7 still in A (wraps), idx 8 is in B (does not wrap)', () => {
    const at7 = computeInfiniteWrap(padding + 7 * step, copyLen, step, padding);
    const at8 = computeInfiniteWrap(padding + 8 * step, copyLen, step, padding);
    expect(at7.needsWrap).toBe(true);
    expect(at8.needsWrap).toBe(false);
  });

  it('boundary: idx 15 in B (no wrap), idx 16 in C (wraps)', () => {
    const at15 = computeInfiniteWrap(padding + 15 * step, copyLen, step, padding);
    const at16 = computeInfiniteWrap(padding + 16 * step, copyLen, step, padding);
    expect(at15.needsWrap).toBe(false);
    expect(at16.needsWrap).toBe(true);
  });

  it('tolerates sub-pixel rounding (idx derived from 779.6 rounds to 8)', () => {
    const r = computeInfiniteWrap(779.6, copyLen, step, padding);
    expect(r.nextIdx).toBe(8);
    expect(r.needsWrap).toBe(false);
  });

  it('returns no-wrap safely when step is 0', () => {
    const r = computeInfiniteWrap(100, 8, 0, 12);
    expect(r.needsWrap).toBe(false);
  });
});

describe('buildInfiniteRows (pure logic)', () => {
  it('triples an 8-item base into 24 rows with unique uids', () => {
    const base = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rows = buildInfiniteRows(base, 3, (item, copy) => `c${copy}-${item}`);
    expect(rows).toHaveLength(24);
    const uids = new Set(rows.map((r) => r.uid));
    expect(uids.size).toBe(24);
  });

  it('preserves order: [A0, A1, …, A7, B0, …, C7]', () => {
    const base = [0, 1, 2, 3, 4, 5, 6, 7];
    const rows = buildInfiniteRows(base, 3, (item, copy) => `${copy}${item}`);
    expect(rows[0]).toEqual({ uid: '00', item: 0 });
    expect(rows[7]).toEqual({ uid: '07', item: 7 });
    expect(rows[8]).toEqual({ uid: '10', item: 0 });
    expect(rows[23]).toEqual({ uid: '27', item: 7 });
  });
});
