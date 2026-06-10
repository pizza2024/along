import { EMOTION_MAP } from '@/constants/emotions';
import { intensityToRGBA } from './color';
import type { CalendarCell, CalendarMode, EmotionKey } from '@/types';

const EMPTY = '#F2F2F2';

export function resolveCellColor(
  cell: CalendarCell,
  mode: CalendarMode,
  selectedEmotion: EmotionKey
): string {
  if (mode === 'aggregate') {
    if (!cell.emotion) return EMPTY;
    return intensityToRGBA(EMOTION_MAP[cell.emotion].color, cell.count);
  }
  // single mode
  const c = cell.perEmotion[selectedEmotion] ?? 0;
  if (c <= 0) return EMPTY;
  return intensityToRGBA(EMOTION_MAP[selectedEmotion].color, c);
}