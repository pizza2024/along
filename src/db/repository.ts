import type { DbAdapter } from './types';
import type { EmotionKey, MoodEntry } from '@/types';

export async function addEntry(
  db: DbAdapter,
  emotion: EmotionKey,
  date: string,
  createdAt: number = Date.now()
): Promise<void> {
  await db.run(
    'INSERT INTO mood_entries (date, emotion, created_at) VALUES (?, ?, ?)',
    [date, emotion, createdAt]
  );
}

export async function deleteEntry(db: DbAdapter, id: number): Promise<void> {
  await db.run('DELETE FROM mood_entries WHERE id = ?', [id]);
}

export async function getEntriesByDateRange(
  db: DbAdapter,
  start: string,
  end: string
): Promise<MoodEntry[]> {
  const rows = await db.all<any>(
    `SELECT id, date, emotion, created_at as createdAt
     FROM mood_entries
     WHERE date BETWEEN ? AND ?
     ORDER BY created_at ASC`,
    [start, end]
  );
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    emotion: r.emotion,
    createdAt: r.createdAt,
  }));
}
