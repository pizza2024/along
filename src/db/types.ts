import type { EmotionKey } from '@/types';

export interface MoodRow {
  id: number;
  date: string;
  emotion: EmotionKey;
  created_at: number;
}

export interface DbAdapter {
  init(): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T = MoodRow>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = MoodRow>(sql: string, params?: unknown[]): Promise<T | null>;
}
