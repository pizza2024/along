import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface FakeStore {
  data: Record<string, string>;
}

function installFakeWx() {
  const store: FakeStore = { data: {} };
  const wx = {
    getStorageSync(key: string): string | undefined {
      return store.data[key];
    },
    setStorageSync(key: string, data: string | object): void {
      store.data[key] = typeof data === 'string' ? data : JSON.stringify(data);
    },
    removeStorageSync(key: string): void {
      delete store.data[key];
    },
  };
  vi.stubGlobal('wx', wx);
  return store;
}

interface DbAdapter {
  init(): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

interface DatabaseModule {
  getDb: () => Promise<DbAdapter>;
  __setAdapter: (a: DbAdapter | null) => void;
}

describe('taro getDb (Taro-local database module)', () => {
  let db: DatabaseModule;
  beforeEach(async () => {
    installFakeWx();
    db = await import('@/db/database');
    db.__setAdapter(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (db) db.__setAdapter(null);
  });

  it('returns a working adapter by default', async () => {
    const adapter = await db.getDb();
    await adapter.run(
      'INSERT INTO mood_entries (date, emotion, created_at) VALUES (?, ?, ?)',
      ['2026-06-10', 'happy', 1000]
    );
    const rows = await adapter.all<any>(
      'SELECT id, date, emotion, created_at as createdAt FROM mood_entries WHERE date BETWEEN ? AND ? ORDER BY created_at ASC',
      ['2026-06-10', '2026-06-10']
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].emotion).toBe('happy');
  });

  it('caches the adapter across calls', async () => {
    const a = await db.getDb();
    const b = await db.getDb();
    expect(a).toBe(b);
  });

  it('respects __setAdapter injection for tests', async () => {
    const fakeAdapter: DbAdapter = {
      async init() {},
      async run() {},
      async all() {
        return [{ id: 1, date: '2026-06-11', emotion: 'calm', createdAt: 2000 } as any];
      },
      async get() {
        return null;
      },
    };
    db.__setAdapter(fakeAdapter);
    const adapter = await db.getDb();
    expect(adapter).toBe(fakeAdapter);
    const rows = await adapter.all<{ emotion: string }>('SELECT * FROM mood_entries', []);
    expect(rows[0].emotion).toBe('calm');
  });

  it('persists entries across adapter instances via wx.storage', async () => {
    await db.__setAdapter(null);
    const a1 = await db.getDb();
    await a1.run(
      'INSERT INTO mood_entries (date, emotion, created_at) VALUES (?, ?, ?)',
      ['2026-06-10', 'grateful', 3000]
    );
    db.__setAdapter(null);
    const a2 = await db.getDb();
    const rows = await a2.all<any>(
      'SELECT id, date, emotion, created_at as createdAt FROM mood_entries WHERE date BETWEEN ? AND ?',
      ['2026-06-10', '2026-06-10']
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].emotion).toBe('grateful');
  });
});
