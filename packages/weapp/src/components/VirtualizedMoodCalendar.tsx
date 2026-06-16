import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { usePageScroll } from '@tarojs/taro';
import { MonthGrid } from './MonthGrid';

type MonthBlock = import('@/hooks/useCalendarData').MonthBlock;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;
const HORIZONTAL_PADDING = 16;
const CELL_GAP = 3;
const ROW_COUNT = 6;
const HEADER_HEIGHT = 48;
const WEEKDAY_BAR_HEIGHT = 28;
const MONTH_BOTTOM_GAP = 12;
const EDGE_THRESHOLD = 10;
const EXTEND_BATCH = 12;

function computeLayout() {
  const usable = 750 - HORIZONTAL_PADDING * 2;
  const cellSize = Math.floor((usable - CELL_GAP * 14) / 7);
  const rowHeight = cellSize + CELL_GAP * 2;
  const monthHeight = HEADER_HEIGHT + rowHeight * ROW_COUNT + MONTH_BOTTOM_GAP;
  return { cellSize, rowHeight, monthHeight };
}

interface Props {
  blocks: MonthBlock[];
  initialIndex: number;
  todayIndex: number;
  onExtendPast?: (count: number) => void;
  onExtendFuture?: (count: number) => void;
}

export function VirtualizedMoodCalendar({
  blocks,
  initialIndex,
  todayIndex,
  onExtendPast,
  onExtendFuture,
}: Props) {
  const [viewport] = useState(() => {
    const info = Taro.getSystemInfoSync();
    return { width: info.windowWidth, height: info.windowHeight };
  });

  const layout = useMemo(() => computeLayout(), []);
  const { cellSize, rowHeight, monthHeight } = layout;

  const [activeIndex, setActiveIndex] = useState(0);
  const extendingPastRef = useRef(false);
  const extendingFutureRef = useRef(false);
  const prevBlocksLenRef = useRef(blocks.length);
  const activeIdxRef = useRef(activeIndex);
  const scrollRpxRef = useRef(0);
  activeIdxRef.current = activeIndex;

  // Snap-to-month after scroll stops
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnappingRef = useRef(false);

  // Reset extend flags when scrolling away from edges
  useEffect(() => {
    const idx = activeIdxRef.current;
    if (idx > EDGE_THRESHOLD && idx < blocks.length - 1 - EDGE_THRESHOLD) {
      extendingPastRef.current = false;
      extendingFutureRef.current = false;
    }
  }, [activeIndex, blocks.length]);

  // Compensate scroll tracking when months are prepended
  useEffect(() => {
    const prevLen = prevBlocksLenRef.current;
    prevBlocksLenRef.current = blocks.length;
    if (blocks.length <= prevLen) return;
    const added = blocks.length - prevLen;
    if (extendingPastRef.current) {
      scrollRpxRef.current = scrollRpxRef.current + added * monthHeight;
    }
  }, [blocks.length, monthHeight]);

  usePageScroll((res) => {
    const topPx = res.scrollTop;
    const ratio = 750 / viewport.width;
    const topRpx = topPx * ratio;
    scrollRpxRef.current = topRpx;
    const idx = Math.round(topRpx / Math.max(monthHeight, 1));
    const clamped = Math.min(Math.max(idx, 0), blocks.length - 1);
    if (clamped !== activeIdxRef.current) setActiveIndex(clamped);

    if (isSnappingRef.current) return;

    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(() => {
      // Snap to nearest month boundary
      const monthPx = monthHeight * (viewport.width / 750);
      const nearest = Math.round(topPx / monthPx) * monthPx;
      const diff = Math.abs(topPx - nearest);
      if (diff > 5 && diff > monthPx * 0.12) {
        isSnappingRef.current = true;
        Taro.pageScrollTo({ scrollTop: Math.round(nearest), duration: 180 });
        setTimeout(() => { isSnappingRef.current = false; }, 250);
      }
    }, 200);
  });

  // Edge detection for infinite scroll
  useEffect(() => {
    const idx = activeIdxRef.current;
    if (
      idx <= EDGE_THRESHOLD &&
      !extendingPastRef.current &&
      onExtendPast
    ) {
      extendingPastRef.current = true;
      onExtendPast(EXTEND_BATCH);
    } else if (
      idx >= blocks.length - 1 - EDGE_THRESHOLD &&
      !extendingFutureRef.current &&
      onExtendFuture
    ) {
      extendingFutureRef.current = true;
      onExtendFuture(EXTEND_BATCH);
    }
  }, [activeIndex, blocks.length, onExtendPast, onExtendFuture]);

  return (
    <View>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `${WEEKDAY_BAR_HEIGHT}rpx`,
          alignItems: 'center',
          paddingLeft: `${HORIZONTAL_PADDING}rpx`,
          paddingRight: `${HORIZONTAL_PADDING}rpx`,
          borderBottomWidth: '1rpx',
          borderBottomStyle: 'solid',
          borderBottomColor: '#ECECEC',
        }}
      >
        {WEEKDAYS.map((w, i) => (
          <View key={w} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: '22rpx',
                color: i === 0 || i === 6 ? '#B85C5C' : '#888',
                letterSpacing: '2rpx',
              }}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>
      {blocks.map((b, index) => (
        <View key={b.meta.key} id={`month-${index}`}>
          <View style={{ height: `${monthHeight}rpx` }}>
            <MonthGrid
              block={b}
              cellSize={cellSize}
              cellGap={CELL_GAP}
              rowCount={ROW_COUNT}
              isActive={index === activeIndex}
              headerHeight={HEADER_HEIGHT}
              rowHeight={rowHeight}
              horizontalPadding={HORIZONTAL_PADDING}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
