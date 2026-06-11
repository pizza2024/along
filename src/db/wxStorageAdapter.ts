import type { DbAdapter } from './types';

interface WxStorage {
  getStorageSync(key: string): string | undefined;
  setStorageSync(key: string, data: string | object): void;
  removeStorageSync(key: string): void;
}

interface WxLike {
  getStorageSync?: WxStorage['getStorageSync'];
  setStorageSync?: WxStorage['setStorageSync'];
  removeStorageSync?: WxStorage['removeStorageSync'];
}

interface Row {
  id: number;
  date: string;
  emotion: string;
  created_at: number;
}

const STORAGE_KEY = 'moodly:mood_entries';

function getWx(): WxLike {
  if (typeof globalThis === 'undefined') return {};
  const g = globalThis as unknown as { wx?: WxLike };
  return g.wx ?? {};
}

function loadRows(): Row[] {
  const wx = getWx();
  if (!wx.getStorageSync) return [];
  const raw = wx.getStorageSync(STORAGE_KEY);
  if (typeof raw !== 'string' || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Row[];
  } catch {
    return [];
  }
}

function saveRows(rows: Row[]): void {
  const wx = getWx();
  if (!wx.setStorageSync) return;
  wx.setStorageSync(STORAGE_KEY, JSON.stringify(rows));
}

export function createWxStorageAdapter(): DbAdapter {
  return {
    async init() {
      loadRows();
    },
    async run(sql: string, params: unknown[] = []) {
      const s = sql.trim();
      const rows = loadRows();
      if (s.startsWith('INSERT INTO mood_entries')) {
        const [date, emotion, created_at] = params as [string, string, number];
        const nextId = rows.reduce((m, r) => (r.id > m ? r.id : m), 0) + 1;
        rows.push({ id: nextId, date, emotion, created_at });
        saveRows(rows);
        return;
      }
      if (s.startsWith('DELETE FROM mood_entries')) {
        const id = params[0] as number;
        const idx = rows.findIndex((r) => r.id === id);
        if (idx >= 0) {
          rows.splice(idx, 1);
          saveRows(rows);
        }
        return;
      }
      throw new Error('Unsupported SQL: ' + s);
    },
    async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const s = sql.trim();
      if (s.startsWith('SELECT')) {
        const [start, end] = params as unknown as [string, string];
        const rows = loadRows();
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
