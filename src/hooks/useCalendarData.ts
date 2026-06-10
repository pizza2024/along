import { useCallback, useEffect, useState } from 'react';
import { getDb } from '@/db/database';
import { addEntry as repoAdd, getEntriesByDateRange } from '@/db/repository';
import { buildCalendarCells } from '@/utils/aggregate';
import { last30Days } from '@/utils/date';
import type { CalendarCell, EmotionKey } from '@/types';

export function useCalendarData() {
  const [cells, setCells] = useState<CalendarCell[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const days = last30Days();
      const db = await getDb();
      const entries = await getEntriesByDateRange(db, days[0], days[days.length - 1]);
      setCells(buildCalendarCells(days, entries));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEmotion = useCallback(async (emotion: EmotionKey) => {
    const db = await getDb();
    const today = last30Days()[last30Days().length - 1];
    await repoAdd(db, emotion, today);
    await refresh();
  }, [refresh]);

  return { cells, loading, refresh, addEmotion };
}
