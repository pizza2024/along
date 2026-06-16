export function tickProgress(
  elapsedMs: number,
  duration: number
): { done: boolean; progress: number } {
  const p = Math.min(1, elapsedMs / duration);
  return { done: p >= 1, progress: p };
}
