import { useStore } from 'zustand';
import { moodStore } from '@moodly/shared';
import type { MoodState } from '@moodly/shared';

export const useMoodStore = <T>(selector: (state: MoodState) => T): T => useStore(moodStore, selector);
