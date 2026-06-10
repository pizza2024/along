import type { CalendarCell, EmotionKey, MoodEntry } from '@/types';
import { EMOTIONS } from '@/constants/emotions';

function emptyPerEmotion(): Record<EmotionKey, number> {
  return EMOTIONS.reduce(
    (acc, e) => ({ ...acc, [e.key]: 0 }),
    {} as Record<EmotionKey, number>
  );
}

export function buildCalendarCells(
  days: string[],
  entries: MoodEntry[]
): CalendarCell[] {
  return days.map((date) => {
    const perEmotion = emptyPerEmotion();
    let total = 0;
    let dominant: EmotionKey | null = null;
    let dominantCount = 0;
    for (const entry of entries) {
      if (entry.date !== date) continue;
      perEmotion[entry.emotion]++;
      total++;
      const newCount = perEmotion[entry.emotion];
      if (
        newCount > dominantCount ||
        (newCount === dominantCount && dominant !== null &&
         EMOTIONS.find(e => e.key === entry.emotion)!.order <
         EMOTIONS.find(e => e.key === dominant)!.order)
      ) {
        dominantCount = newCount;
        dominant = entry.emotion;
      }
    }
    return {
      date,
      count: Math.min(total, 4),
      emotion: dominant,
      perEmotion,
    };
  });
}
