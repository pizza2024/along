export type EmotionKey =
  | 'happy' | 'calm' | 'grateful' | 'excited'
  | 'anxious' | 'sad' | 'angry' | 'tired';

export interface Emotion {
  key: EmotionKey;
  label: string;
  color: string;
  order: number;
}

export interface MoodEntry {
  id: number;
  date: string;
  emotion: EmotionKey;
  createdAt: number;
}

export type CalendarMode = 'aggregate' | 'single';

export interface CalendarCell {
  date: string;
  count: number;
  emotion: EmotionKey | null;
  perEmotion: Record<EmotionKey, number>;
}