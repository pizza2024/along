import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MoodDayCell } from './MoodDayCell';
import { toDateKey } from '@/utils/date';
import type { CalendarCell } from '@/types';
import type { MonthBlock } from '@/hooks/useCalendarData';

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

function MonthGridInner({
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
      style={[
        styles.month,
        { paddingHorizontal: horizontalPadding },
        !isActive && styles.dimmed,
      ]}
    >
      <View style={[styles.header, { height: headerHeight }]}>
        <Text style={[styles.title, isActive ? styles.titleActive : styles.titleInactive]}>
          {`${block.meta.year} 年 ${block.meta.month + 1} 月`}
        </Text>
        {isActive && <View style={styles.titleUnderline} />}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: rowCount }, (_, row) => (
          <View key={row} style={[styles.row, { height: rowHeight }]}>
            {Array.from({ length: 7 }, (_, col) => {
              const idx = row * 7 + col;
              const cell = slots[idx];
              return (
                <View
                  key={col}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    marginHorizontal: cellGap,
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

export const MonthGrid = React.memo(MonthGridInner);

const styles = StyleSheet.create({
  month: {
    width: '100%',
  },
  dimmed: {
    opacity: 0.32,
  },
  header: {
    justifyContent: 'center',
    paddingLeft: 4,
  },
  title: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  titleActive: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 20,
  },
  titleInactive: {
    color: '#999',
    fontWeight: '500',
  },
  titleUnderline: {
    marginTop: 4,
    height: 2,
    width: 24,
    borderRadius: 1,
    backgroundColor: '#1A1A1A',
  },
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
