import React from 'react';
import { View, StyleSheet } from 'react-native';
import { resolveCellColor } from '@/utils/resolveCellColor';
import { useMoodStore } from '@/store/moodStore';
import type { CalendarCell } from '@/types';

interface Props {
  cell: CalendarCell;
  isToday?: boolean;
}

export function MoodDayCell({ cell, isToday = false }: Props) {
  const mode = useMoodStore((s) => s.mode);
  const selectedEmotion = useMoodStore((s) => s.selectedEmotion);
  const bg = resolveCellColor(cell, mode, selectedEmotion);
  return (
    <View
      style={[
        styles.cell,
        { backgroundColor: bg },
        isToday && styles.today,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 44,
    height: 44,
    borderRadius: 6,
    margin: 3,
  },
  today: {
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
});