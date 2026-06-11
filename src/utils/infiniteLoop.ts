export interface InfiniteWrapResult {
  needsWrap: boolean;
  nextOffset: number;
  nextIdx: number;
}

const DEFAULT_REPEATS = 3;

/**
 * Given a current scroll offset inside an odd-repeated (3, 5, 7, …) row,
 * decide whether to wrap and to where.
 *
 * Data layout for `repeats = 5`: [A][B][C][D][E] where each copy is identical.
 * User starts in the middle copy C. When the user scrolls into A or E (the
 * outer copies) we silently jump them to the equivalent position in C, so
 * the loop feels endless. B and D are the safety buffer; the user can be
 * inside them and we do nothing.
 *
 * For `repeats = 3` (legacy): [A][B][C], user starts in B; A wraps to B
 * and C wraps to B. The formula is the same with `MIDDLE_OFFSET_COPIES = 1`.
 *
 * The "wrap to center" design matters because the scroll handler also calls
 * this from `onScroll` while the user is dragging. If we wrapped to the
 * opposite outer edge, the user would ping-pong between A and E on every
 * scroll tick. Wrapping to the center lands them in a stable position.
 *
 * `repeats` must be an odd integer ≥ 3. The "middle offset" is the number
 * of copies between the start copy and either outer edge.
 */
export function computeInfiniteWrap(
  offsetX: number,
  copyLen: number,
  step: number,
  padding: number,
  repeats: number = DEFAULT_REPEATS
): InfiniteWrapResult {
  if (copyLen <= 0 || step <= 0) {
    return { needsWrap: false, nextOffset: offsetX, nextIdx: 0 };
  }
  const middleOffsetCopies = (repeats - 1) / 2;
  const idx = Math.round((offsetX - padding) / step);
  if (idx < copyLen) {
    const nextIdx = idx + middleOffsetCopies * copyLen;
    return {
      needsWrap: true,
      nextIdx,
      nextOffset: padding + nextIdx * step,
    };
  }
  if (idx >= (repeats - 1) * copyLen) {
    const nextIdx = idx - middleOffsetCopies * copyLen;
    return {
      needsWrap: true,
      nextIdx,
      nextOffset: padding + nextIdx * step,
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
