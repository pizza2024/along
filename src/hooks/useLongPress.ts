import { useRef, useCallback } from 'react';

export interface LongPressOptions {
  duration: number; // ms
  onComplete: () => void;
  onProgress?: (p: number) => void;
}

export interface LongPressHandlers {
  onPressIn: () => void;
  onPressOut: () => void;
}

const TICK_MS = 16;

/**
 * Pure tick logic — exported for unit testing.
 * Returns whether the press completed at this tick.
 */
export function tickProgress(
  elapsedMs: number,
  duration: number
): { done: boolean; progress: number } {
  const p = Math.min(1, elapsedMs / duration);
  return { done: p >= 1, progress: p };
}

export function useLongPress(opts: LongPressOptions): LongPressHandlers {
  const { duration, onComplete, onProgress } = opts;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<number>(0);
  const firedRef = useRef<boolean>(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    elapsedRef.current += TICK_MS;
    const { done, progress } = tickProgress(elapsedRef.current, duration);
    onProgress?.(progress);
    if (done) {
      firedRef.current = true;
      clear();
      onComplete();
      return;
    }
    timerRef.current = setTimeout(tick, TICK_MS);
  }, [duration, onComplete, onProgress, clear]);

  const onPressIn = useCallback(() => {
    clear();
    firedRef.current = false;
    elapsedRef.current = 0;
    tick();
  }, [clear, tick]);

  const onPressOut = useCallback(() => {
    clear();
    onProgress?.(0);
  }, [clear, onProgress]);

  return { onPressIn, onPressOut };
}