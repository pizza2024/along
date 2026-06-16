export const HAPTIC_THROTTLE_MS = 80;

export function shouldFireScrollHaptic(
  prev: number | null,
  curr: number,
  nowMs: number,
  lastHapticMs: number | null,
  throttleMs: number = HAPTIC_THROTTLE_MS
): boolean {
  if (prev === null || prev === curr) return false;
  if (lastHapticMs !== null && nowMs - lastHapticMs < throttleMs) return false;
  return true;
}
