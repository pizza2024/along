// @ts-ignore - expo-sqlite ships only the runtime on native; types are best-effort in node
import * as SQLite from 'expo-sqlite';
import type { DbAdapter } from './types';

export function createSqliteAdapter(db: SQLite.SQLiteDatabase): DbAdapter {
  return {
    async init() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          emotion TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_mood_date ON mood_entries(date);
      `);
    },
    async run(sql: string, params: unknown[] = []) {
      await db.runAsync(sql, ...(params as any[]));
    },
    async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      return db.getAllAsync<T>(sql, ...(params as any[]));
    },
    async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const row = await db.getFirstAsync<T>(sql, ...(params as any[]));
      return row ?? null;
    },
  };
}
