import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createWxStorageAdapter } from '@/db/wxStorageAdapter';
import { addEntry, deleteEntry, getEntriesByDateRange } from '@/db/repository';

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

describe('wxStorageAdapter', () => {
  let store: FakeStore;
  beforeEach(() => {
    store = installFakeWx();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('init is a no-op', async () => {
    const db = createWxStorageAdapter();
    await expect(db.init()).resolves.toBeUndefined();
  });

  it('persists across adapter instances (singleton storage)', async () => {
    const db1 = createWxStorageAdapter();
    await addEntry(db1, 'happy', '2026-06-10', 1000);
    const db2 = createWxStorageAdapter();
    const rows = await getEntriesByDateRange(db2, '2026-06-10', '2026-06-10');
    expect(rows).toHaveLength(1);
    expect(rows[0].emotion).toBe('happy');
  });

  it('returns [] when storage key is missing', async () => {
    const db = createWxStorageAdapter();
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(rows).toEqual([]);
  });

  it('returns [] when stored JSON is corrupted', async () => {
    store.data['moodly:mood_entries'] = '{not valid json';
    const db = createWxStorageAdapter();
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(rows).toEqual([]);
  });

  it('returns [] when stored value is not an array', async () => {
    store.data['moodly:mood_entries'] = JSON.stringify({ foo: 1 });
    const db = createWxStorageAdapter();
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(rows).toEqual([]);
  });

  it('addEntry / getEntriesByDateRange / deleteEntry round-trip', async () => {
    const db = createWxStorageAdapter();
    await addEntry(db, 'happy', '2026-06-10', 1000);
    await addEntry(db, 'calm', '2026-06-10', 2000);
    const before = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(before).toHaveLength(2);
    expect(before[0].emotion).toBe('happy');
    await deleteEntry(db, before[0].id);
    const after = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(after).toHaveLength(1);
    expect(after[0].emotion).toBe('calm');
  });

  it('respects the same SQL contract as the in-memory adapter', async () => {
    const db = createWxStorageAdapter();
    await db.run(
      'INSERT INTO mood_entries (date, emotion, created_at) VALUES (?, ?, ?)',
      ['2026-06-10', 'sad', 3000]
    );
    const rows = await db.all<any>(
      'SELECT id, date, emotion, created_at as createdAt FROM mood_entries WHERE date BETWEEN ? AND ? ORDER BY created_at ASC',
      ['2026-06-10', '2026-06-10']
    );
    expect(rows[0]).toMatchObject({ date: '2026-06-10', emotion: 'sad', createdAt: 3000 });
  });

  it('rejects unsupported SQL statements', async () => {
    const db = createWxStorageAdapter();
    await expect(db.run('DROP TABLE x')).rejects.toThrow(/Unsupported SQL/);
    await expect(db.all('UPDATE foo SET bar = 1')).rejects.toThrow(/Unsupported SQL/);
  });

  it('get() returns the first row or null', async () => {
    const db = createWxStorageAdapter();
    await addEntry(db, 'happy', '2026-06-10', 1000);
    const row = await db.get<any>(
      'SELECT * FROM mood_entries WHERE date BETWEEN ? AND ?',
      ['2026-06-10', '2026-06-10']
    );
    expect(row).not.toBeNull();
    expect(row!.emotion).toBe('happy');
    const empty = await db.get(
      'SELECT * FROM mood_entries WHERE date BETWEEN ? AND ?',
      ['2099-01-01', '2099-01-01']
    );
    expect(empty).toBeNull();
  });
});
