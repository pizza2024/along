import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDb } from './inMemoryDb';
import { addEntry, deleteEntry, getEntriesByDateRange } from '@/db/repository';

describe('repository', () => {
  let db: ReturnType<typeof createInMemoryDb>;

  beforeEach(() => {
    db = createInMemoryDb();
  });

  it('adds and retrieves an entry', async () => {
    await addEntry(db, 'happy', '2026-06-10', 1000);
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      date: '2026-06-10',
      emotion: 'happy',
      createdAt: 1000,
    });
    expect(typeof rows[0].id).toBe('number');
  });

  it('adds multiple entries and retrieves in created_at order', async () => {
    await addEntry(db, 'happy', '2026-06-10', 2000);
    await addEntry(db, 'calm', '2026-06-10', 1000);
    await addEntry(db, 'sad', '2026-06-10', 3000);
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(rows.map((r) => r.createdAt)).toEqual([1000, 2000, 3000]);
  });

  it('filters by date range (inclusive bounds)', async () => {
    await addEntry(db, 'happy', '2026-06-09', 1000);
    await addEntry(db, 'happy', '2026-06-10', 2000);
    await addEntry(db, 'happy', '2026-06-11', 3000);
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-06-10');
  });

  it('returns empty array when no entries in range', async () => {
    await addEntry(db, 'happy', '2026-05-01', 1000);
    const rows = await getEntriesByDateRange(db, '2026-06-10', '2026-06-20');
    expect(rows).toEqual([]);
  });

  it('deletes an entry by id', async () => {
    await addEntry(db, 'happy', '2026-06-10', 1000);
    await addEntry(db, 'calm', '2026-06-10', 2000);
    const before = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(before).toHaveLength(2);
    await deleteEntry(db, before[0].id);
    const after = await getEntriesByDateRange(db, '2026-06-10', '2026-06-10');
    expect(after).toHaveLength(1);
    expect(after[0].emotion).toBe('calm');
  });

  it('deleteEntry on nonexistent id does not throw', async () => {
    await expect(deleteEntry(db, 9999)).resolves.toBeUndefined();
  });
});
