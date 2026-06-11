import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { MoodDayCell } from './MoodDayCell';
import { toDateKey } from '@/utils/date';

type CalendarCell = import('@/types').CalendarCell;
type MonthBlock = import('@/hooks/useCalendarData').MonthBlock;

interface Props {
  block: MonthBlock;
  cellSize: number;
  cellGap: number;
  rowCount: number;
  isActive: boolean;
  headerHeight: number;
  rowHeight: number;
  horizontalPadding: number;
}

const TODAY_KEY = () => toDateKey(new Date());

function buildSlots(block: MonthBlock): (CalendarCell | null)[] {
  const total = 42;
  const slots: (CalendarCell | null)[] = new Array(total).fill(null);
  const lead = block.meta.firstWeekday;
  for (let i = 0; i < block.cells.length; i++) {
    slots[lead + i] = block.cells[i];
  }
  return slots;
}

export function MonthGrid({
  block,
  cellSize,
  cellGap,
  rowCount,
  isActive,
  headerHeight,
  rowHeight,
  horizontalPadding,
}: Props) {
  const slots = useMemo(() => buildSlots(block), [block]);
  const today = TODAY_KEY();

  return (
    <View
      style={{
        width: '100%',
        opacity: isActive ? 1 : 0.32,
        paddingLeft: `${horizontalPadding}rpx`,
        paddingRight: `${horizontalPadding}rpx`,
      }}
    >
      <View
        style={{
          height: `${headerHeight}rpx`,
          justifyContent: 'center',
          paddingLeft: '4rpx',
        }}
      >
        <Text
          style={{
            fontSize: isActive ? '40rpx' : '36rpx',
            color: isActive ? '#1A1A1A' : '#999',
            fontWeight: isActive ? '700' : '500',
            letterSpacing: '1rpx',
          }}
        >
          {`${block.meta.year} 年 ${block.meta.month + 1} 月`}
        </Text>
        {isActive && (
          <View
            style={{
              marginTop: '4rpx',
              height: '4rpx',
              width: '48rpx',
              borderRadius: '2rpx',
              backgroundColor: '#1A1A1A',
            }}
          />
        )}
      </View>
      <View style={{ width: '100%' }}>
        {Array.from({ length: rowCount }, (_, row) => (
          <View
            key={row}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              height: `${rowHeight}rpx`,
            }}
          >
            {Array.from({ length: 7 }, (_, col) => {
              const idx = row * 7 + col;
              const cell = slots[idx];
              return (
                <View
                  key={col}
                  style={{
                    width: `${cellSize}rpx`,
                    height: `${cellSize}rpx`,
                    marginLeft: `${cellGap}rpx`,
                    marginRight: `${cellGap}rpx`,
                  }}
                >
                  {cell && (
                    <MoodDayCell
                      cell={cell}
                      isToday={cell.date === today}
                      size={cellSize}
                      showDayNumber
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
