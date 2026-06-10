import type { Emotion, EmotionKey } from '@/types';

export const EMOTIONS: readonly Emotion[] = [
  { key: 'happy',    label: '开心', color: '#F5C518', order: 0 },
  { key: 'calm',     label: '平静', color: '#7FBF7F', order: 1 },
  { key: 'grateful', label: '感恩', color: '#E89AAE', order: 2 },
  { key: 'excited',  label: '兴奋', color: '#E89B4A', order: 3 },
  { key: 'anxious',  label: '焦虑', color: '#8B6FBF', order: 4 },
  { key: 'sad',      label: '难过', color: '#4A6FA5', order: 5 },
  { key: 'angry',    label: '愤怒', color: '#D64545', order: 6 },
  { key: 'tired',    label: '疲惫', color: '#8A9BA8', order: 7 },
] as const;

export const EMOTION_MAP: Record<EmotionKey, Emotion> =
  EMOTIONS.reduce(
    (acc, e) => ({ ...acc, [e.key]: e }),
    {} as Record<EmotionKey, Emotion>
  );