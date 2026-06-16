// Types
export type {
  EmotionKey, Emotion, MoodEntry, CalendarMode, CalendarCell,
} from './types';

// Constants
export { EMOTIONS, EMOTION_MAP } from './constants/emotions';

// Utils
export { hexToRgb, intensityToRGBA } from './utils/color';
export { toDateKey, last30Days } from './utils/date';
export { getMonthMeta, getMonthDays, getMonthsRange, getMonthSpanDateRange, findMonthIndex } from './utils/month';
export type { MonthMeta } from './utils/month';
export { buildCalendarCells } from './utils/aggregate';
export { resolveCellColor } from './utils/resolveCellColor';
export { computeInfiniteWrap, buildInfiniteRows } from './utils/infiniteLoop';
export type { InfiniteWrapResult } from './utils/infiniteLoop';
export { shouldFireScrollHaptic, HAPTIC_THROTTLE_MS } from './utils/scrollHaptic';
export { tickProgress } from './utils/tickProgress';

// DB
export type { DbAdapter, MoodRow } from './db/types';
export { addEntry, deleteEntry, getEntriesByDateRange } from './db/repository';
export { createInMemoryAdapter } from './db/inMemoryAdapter';
export { createWxStorageAdapter } from './db/wxStorageAdapter';

// Store (vanilla — wrap with useStore() for React hooks)
export { moodStore } from './store/moodStore';
export type { MoodState } from './store/moodStore';
