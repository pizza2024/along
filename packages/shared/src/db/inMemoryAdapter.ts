import type { DbAdapter } from './types';

interface Row {
  id: number;
  date: string;
  emotion: string;
  created_at: number;
}

export function createInMemoryAdapter(): DbAdapter {
  let nextId = 1;
  const rows: Row[] = [];
  return {
    async init() {},
    async run(sql: string, params: unknown[] = []) {
      const s = sql.trim();
      if (s.startsWith('INSERT INTO mood_entries')) {
        const [date, emotion, created_at] = params as [string, string, number];
        rows.push({ id: nextId++, date, emotion, created_at });
        return;
      }
      if (s.startsWith('DELETE FROM mood_entries')) {
        const id = params[0] as number;
        const idx = rows.findIndex((r) => r.id === id);
        if (idx >= 0) rows.splice(idx, 1);
        return;
      }
      throw new Error('Unsupported SQL: ' + s);
    },
    async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const s = sql.trim();
      if (s.startsWith('SELECT')) {
        const [start, end] = params as unknown as [string, string];
        return rows
          .filter((r) => r.date >= start && r.date <= end)
          .sort((a, b) => a.created_at - b.created_at)
          .map((r) => ({
            id: r.id,
            date: r.date,
            emotion: r.emotion,
            createdAt: r.created_at,
          })) as unknown as T[];
      }
      throw new Error('Unsupported SQL: ' + s);
    },
    async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const all = await this.all<T>(sql, params);
      return (all[0] as T) ?? null;
    },
  };
}
