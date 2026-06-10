import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDb } from '@/db/database';
import { addEntry as repoAdd, getEntriesByDateRange } from '@/db/repository';
import { buildCalendarCells } from '@/utils/aggregate';
import { toDateKey } from '@/utils/date';
import {
  getMonthsRange,
  getMonthDays,
  getMonthSpanDateRange,
  type MonthMeta,
} from '@/utils/month';
import type { CalendarCell, EmotionKey, MoodEntry } from '@/types';

export interface MonthBlock {
  meta: MonthMeta;
  cells: CalendarCell[];
}

export interface UseCalendarDataOptions {
  initialPastMonths?: number;
  initialFutureMonths?: number;
}

export function useCalendarData(options: UseCalendarDataOptions = {}) {
  const { initialPastMonths = 24, initialFutureMonths = 12 } = options;

  const today = useMemo(() => new Date(), []);
  const [pastMonths, setPastMonths] = useState(initialPastMonths);
  const [futureMonths, setFutureMonths] = useState(initialFutureMonths);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const months = useMemo(
    () => getMonthsRange(today.getFullYear(), today.getMonth(), pastMonths, futureMonths),
    [today, pastMonths, futureMonths]
  );

  const blocks = useMemo<MonthBlock[]>(
    () =>
      months.map((meta) => ({
        meta,
        cells: buildCalendarCells(getMonthDays(meta.year, meta.month), entries),
      })),
    [months, entries]
  );

  const currentMonthIndex = pastMonths;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getMonthSpanDateRange(months);
      const db = await getDb();
      const fetched = await getEntriesByDateRange(db, start, end);
      setEntries(fetched);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEmotion = useCallback(
    async (emotion: EmotionKey) => {
      const db = await getDb();
      await repoAdd(db, emotion, toDateKey(new Date()));
      await refresh();
    },
    [refresh]
  );

  const extendPast = useCallback((count: number = 12) => {
    if (count <= 0) return;
    setPastMonths((p) => p + count);
  }, []);

  const extendFuture = useCallback((count: number = 12) => {
    if (count <= 0) return;
    setFutureMonths((f) => f + count);
  }, []);

  return {
    blocks,
    months,
    currentMonthIndex,
    loading,
    refresh,
    addEmotion,
    extendPast,
    extendFuture,
  };
}
