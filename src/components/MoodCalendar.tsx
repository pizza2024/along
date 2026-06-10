import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MoodDayCell } from './MoodDayCell';
import { toDateKey } from '@/utils/date';
import type { CalendarCell } from '@/types';

interface Props {
  cells: CalendarCell[];
}

export function MoodCalendar({ cells }: Props) {
  const todayKey = toDateKey(new Date());
  return (
    <View style={styles.grid}>
      {cells.map((c) => (
        <MoodDayCell key={c.date} cell={c} isToday={c.date === todayKey} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
});