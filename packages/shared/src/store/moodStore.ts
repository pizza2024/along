import { createStore } from 'zustand/vanilla';
import type { CalendarMode, EmotionKey } from '../types';

export interface MoodState {
  selectedEmotion: EmotionKey;
  mode: CalendarMode;
  setSelectedEmotion: (k: EmotionKey) => void;
  toggleMode: () => void;
}

export const moodStore = createStore<MoodState>((set) => ({
  selectedEmotion: 'happy',
  mode: 'aggregate',
  setSelectedEmotion: (k) => set({ selectedEmotion: k }),
  toggleMode: () => set((s) => ({
    mode: s.mode === 'aggregate' ? 'single' : 'aggregate',
  })),
}));