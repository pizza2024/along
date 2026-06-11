import React from 'react';
import { View, Text } from '@tarojs/components';
import { resolveCellColor } from '@/utils/resolveCellColor';
import { useMoodStore } from '@/store/moodStore';

type CalendarCell = import('@/types').CalendarCell;

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
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        borderRadius: `${radius}rpx`,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isToday ? '1.5rpx' : '0',
        borderColor: isToday ? '#1A1A1A' : 'transparent',
        borderStyle: isToday ? 'solid' : 'none',
      }}
    >
      {showDayNumber && (
        <Text
          style={{
            color: isToday ? '#1A1A1A' : '#3A3A3A',
            fontSize: `${Math.max(10, Math.round(size * 0.32))}rpx`,
            fontWeight: isToday ? '700' : '500',
          }}
        >
          {dayNum}
        </Text>
      )}
    </View>
  );
}
