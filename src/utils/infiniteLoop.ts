export interface InfiniteWrapResult {
  needsWrap: boolean;
  nextOffset: number;
  nextIdx: number;
}

/**
 * Given a current scroll offset inside a tripled (or 2N+1)-repeated row,
 * decide whether to wrap and to where.
 *
 * Data layout: [A][B][C] where A, B, C are identical copies of the base.
 * User starts in B. When the user scrolls into A we want to silently
 * jump them to the equivalent position in C (and vice versa), so the
 * loop feels endless.
 */
export function computeInfiniteWrap(
  offsetX: number,
  copyLen: number,
  step: number,
  padding: number
): InfiniteWrapResult {
  if (copyLen <= 0 || step <= 0) {
    return { needsWrap: false, nextOffset: offsetX, nextIdx: 0 };
  }
  const idx = Math.round((offsetX - padding) / step);
  if (idx < copyLen) {
    return {
      needsWrap: true,
      nextIdx: idx + copyLen * 2,
      nextOffset: padding + (idx + copyLen * 2) * step,
    };
  }
  if (idx >= copyLen * 2) {
    return {
      needsWrap: true,
      nextIdx: idx - copyLen * 2,
      nextOffset: padding + (idx - copyLen * 2) * step,
    };
  }
  return { needsWrap: false, nextOffset: offsetX, nextIdx: idx };
}

export function buildInfiniteRows<T>(
  base: readonly T[],
  repeats: number,
  copyTag: (item: T, copy: number) => string
): Array<{ uid: string; item: T }> {
  const out: Array<{ uid: string; item: T }> = [];
  for (let r = 0; r < repeats; r++) {
    for (const item of base) {
      out.push({ uid: copyTag(item, r), item });
    }
  }
  return out;
}
