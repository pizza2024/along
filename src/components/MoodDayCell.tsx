import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { resolveCellColor } from '@/utils/resolveCellColor';
import { useMoodStore } from '@/store/moodStore';
import type { CalendarCell } from '@/types';

interface Props {
  cell: CalendarCell;
  isToday?: boolean;
  size?: number;
  showDayNumber?: boolean;
}

export function MoodDayCell({
  cell,
  isToday = false,
  size = 44,
  showDayNumber = false,
}: Props) {
  const mode = useMoodStore((s) => s.mode);
  const selectedEmotion = useMoodStore((s) => s.selectedEmotion);
  const bg = resolveCellColor(cell, mode, selectedEmotion);
  const radius = Math.max(4, Math.round(size * 0.22));
  const dayNum = parseInt(cell.date.slice(-2), 10);
  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
        },
        isToday && styles.today,
      ]}
    >
      {showDayNumber && (
        <Text
          style={[
            styles.dayText,
            { fontSize: Math.max(10, Math.round(size * 0.32)) },
            isToday && styles.todayText,
          ]}
        >
          {dayNum}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
  dayText: {
    color: '#3A3A3A',
    fontWeight: '500',
  },
  todayText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});
