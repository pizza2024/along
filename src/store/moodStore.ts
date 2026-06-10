import { create } from 'zustand';
import type { CalendarMode, EmotionKey } from '@/types';

interface MoodState {
  selectedEmotion: EmotionKey;
  mode: CalendarMode;
  setSelectedEmotion: (k: EmotionKey) => void;
  toggleMode: () => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  selectedEmotion: 'happy',
  mode: 'aggregate',
  setSelectedEmotion: (k) => set({ selectedEmotion: k }),
  toggleMode: () => set((s) => ({
    mode: s.mode === 'aggregate' ? 'single' : 'aggregate',
  })),
}));