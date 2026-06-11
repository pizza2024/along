import { describe, it, expect } from 'vitest';
import { computeInfiniteWrap, buildInfiniteRows } from '@/utils/infiniteLoop';

describe('computeInfiniteWrap (pure logic, default REPEATS=3, [A][B][C], start at B)', () => {
  const copyLen = 8;
  const step = 96; // buttonSize 88 + gap 8
  const padding = 12;

  it('does not wrap when sitting in the start copy (B)', () => {
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

  it('wraps A → B: idx 0 of A becomes idx 8 of B', () => {
    const r = computeInfiniteWrap(padding + 0 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(8);
    expect(r.nextOffset).toBe(padding + 8 * step);
  });

  it('wraps A → B: idx 5 of A becomes idx 13 of B', () => {
    const r = computeInfiniteWrap(padding + 5 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(13);
    expect(r.nextOffset).toBe(padding + 13 * step);
  });

  it('wraps A → B: last item of A (idx 7) becomes last item of B (idx 15)', () => {
    const r = computeInfiniteWrap(padding + 7 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(15);
    expect(r.nextOffset).toBe(padding + 15 * step);
  });

  it('wraps C → B: idx 16 of C becomes idx 8 of B', () => {
    const r = computeInfiniteWrap(padding + 16 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(8);
    expect(r.nextOffset).toBe(padding + 8 * step);
  });

  it('wraps C → B: last item of C (idx 23) becomes last item of B (idx 15)', () => {
    const r = computeInfiniteWrap(padding + 23 * step, copyLen, step, padding);
    expect(r.needsWrap).toBe(true);
    expect(r.nextIdx).toBe(15);
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

describe('computeInfiniteWrap at narrow-screen sizes (buttonSize capped to 64, REPEATS=3)', () => {
  const copyLen = 8;
  const padding = 12;

  // Narrow phones: buttonSize 43 (iPhone SE 375) → step 51
  // Mid phones:   buttonSize 46 (iPhone 16 Pro 393) → step 54
  const cases = [
    { label: 'iPhone SE 375pt', step: 51 },
    { label: 'iPhone 16 Pro 393pt', step: 54 },
  ];

  for (const { label, step } of cases) {
    describe(label, () => {
      it('does not wrap while sitting in start copy B', () => {
        const r = computeInfiniteWrap(padding + 10 * step, copyLen, step, padding);
        expect(r.needsWrap).toBe(false);
        expect(r.nextIdx).toBe(10);
      });

      it('wraps A → B at the start of A (idx 0 → idx 8)', () => {
        const r = computeInfiniteWrap(padding + 0 * step, copyLen, step, padding);
        expect(r.needsWrap).toBe(true);
        expect(r.nextIdx).toBe(8);
        expect(r.nextOffset).toBe(padding + 8 * step);
      });

      it('wraps A → B at the last item of A (idx 7 → idx 15)', () => {
        const r = computeInfiniteWrap(padding + 7 * step, copyLen, step, padding);
        expect(r.needsWrap).toBe(true);
        expect(r.nextIdx).toBe(15);
      });

      it('wraps C → B at the first item of C (idx 16 → idx 8)', () => {
        const r = computeInfiniteWrap(padding + 16 * step, copyLen, step, padding);
        expect(r.needsWrap).toBe(true);
        expect(r.nextIdx).toBe(8);
        expect(r.nextOffset).toBe(padding + 8 * step);
      });

      it('wraps C → B at the last item of C (idx 23 → idx 15)', () => {
        const r = computeInfiniteWrap(padding + 23 * step, copyLen, step, padding);
        expect(r.needsWrap).toBe(true);
        expect(r.nextIdx).toBe(15);
      });

      it('boundary: idx 7 wraps, idx 8 does not', () => {
        expect(computeInfiniteWrap(padding + 7 * step, copyLen, step, padding).needsWrap).toBe(true);
        expect(computeInfiniteWrap(padding + 8 * step, copyLen, step, padding).needsWrap).toBe(false);
      });

      it('tolerates sub-pixel rounding', () => {
        const noisy = padding + 8 * step - 0.4;
        const r = computeInfiniteWrap(noisy, copyLen, step, padding);
        expect(r.nextIdx).toBe(8);
        expect(r.needsWrap).toBe(false);
      });
    });
  }
});

describe('computeInfiniteWrap with REPEATS=5 (data layout [A][B][C][D][E], start at C)', () => {
  const copyLen = 8;
  const padding = 12;
  const repeats = 5;
  const middleOffsetCopies = (repeats - 1) / 2; // 2

  const cases = [
    { label: 'iPhone SE 375pt (buttonSize 43)', step: 51 },
    { label: 'iPhone 16 Pro 393pt (buttonSize 46)', step: 54 },
  ];

  for (const { label, step } of cases) {
    describe(label, () => {
      it('does not wrap in the safety buffer B (idx 8..15)', () => {
        for (const idx of [8, 10, 15]) {
          const r = computeInfiniteWrap(padding + idx * step, copyLen, step, padding, repeats);
          expect(r.needsWrap).toBe(false);
          expect(r.nextIdx).toBe(idx);
        }
      });

      it('does not wrap in the start copy C (idx 16..23)', () => {
        for (const idx of [16, 20, 23]) {
          const r = computeInfiniteWrap(padding + idx * step, copyLen, step, padding, repeats);
          expect(r.needsWrap).toBe(false);
          expect(r.nextIdx).toBe(idx);
        }
      });

      it('does not wrap in the safety buffer D (idx 24..31)', () => {
        for (const idx of [24, 28, 31]) {
          const r = computeInfiniteWrap(padding + idx * step, copyLen, step, padding, repeats);
          expect(r.needsWrap).toBe(false);
          expect(r.nextIdx).toBe(idx);
        }
      });

      it('wraps A → C: idx 0..7 in copy A jumps to idx 16..23 in copy C', () => {
        for (const idx of [0, 3, 7]) {
          const r = computeInfiniteWrap(padding + idx * step, copyLen, step, padding, repeats);
          expect(r.needsWrap).toBe(true);
          const expected = idx + middleOffsetCopies * copyLen;
          expect(r.nextIdx).toBe(expected);
          expect(r.nextOffset).toBe(padding + expected * step);
        }
      });

      it('wraps E → C: idx 32..39 in copy E jumps to idx 16..23 in copy C', () => {
        for (const idx of [32, 35, 39]) {
          const r = computeInfiniteWrap(padding + idx * step, copyLen, step, padding, repeats);
          expect(r.needsWrap).toBe(true);
          const expected = idx - middleOffsetCopies * copyLen;
          expect(r.nextIdx).toBe(expected);
          expect(r.nextOffset).toBe(padding + expected * step);
        }
      });

      it('boundary: idx 7 (A) wraps, idx 8 (B) does not', () => {
        expect(computeInfiniteWrap(padding + 7 * step, copyLen, step, padding, repeats).needsWrap).toBe(true);
        expect(computeInfiniteWrap(padding + 8 * step, copyLen, step, padding, repeats).needsWrap).toBe(false);
      });

      it('boundary: idx 31 (D) does not wrap, idx 32 (E) wraps', () => {
        expect(computeInfiniteWrap(padding + 31 * step, copyLen, step, padding, repeats).needsWrap).toBe(false);
        expect(computeInfiniteWrap(padding + 32 * step, copyLen, step, padding, repeats).needsWrap).toBe(true);
      });

      it('A0 wraps to C0 (same logical content, equivalent visual)', () => {
        const a0 = computeInfiniteWrap(padding + 0 * step, copyLen, step, padding, repeats);
        const c0 = computeInfiniteWrap(padding + 16 * step, copyLen, step, padding, repeats);
        expect(a0.needsWrap).toBe(true);
        expect(a0.nextIdx).toBe(16);
        expect(c0.needsWrap).toBe(false);
        expect(c0.nextIdx).toBe(16);
      });

      it('E0 wraps to C0 (same logical content, equivalent visual)', () => {
        const e0 = computeInfiniteWrap(padding + 32 * step, copyLen, step, padding, repeats);
        const c0 = computeInfiniteWrap(padding + 16 * step, copyLen, step, padding, repeats);
        expect(e0.needsWrap).toBe(true);
        expect(e0.nextIdx).toBe(16);
        expect(c0.needsWrap).toBe(false);
        expect(c0.nextIdx).toBe(16);
      });

      it('tolerates sub-pixel rounding in the safety zone', () => {
        const noisy = padding + 16 * step - 0.4;
        const r = computeInfiniteWrap(noisy, copyLen, step, padding, repeats);
        expect(r.nextIdx).toBe(16);
        expect(r.needsWrap).toBe(false);
      });
    });
  }
});
