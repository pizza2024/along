import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MoodDayCell } from './MoodDayCell';
import type { CalendarCell } from '@/types';

interface Props {
  cells: CalendarCell[];
}

export function MoodCalendar({ cells }: Props) {
  return (
    <View style={styles.grid}>
      {cells.map((c) => (
        <MoodDayCell key={c.date} cell={c} />
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