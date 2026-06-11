import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MonthGrid } from './MonthGrid';

type MonthBlock = import('@/hooks/useCalendarData').MonthBlock;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;
const HORIZONTAL_PADDING = 16;
const CELL_GAP = 3;
const ROW_COUNT = 6;
const HEADER_HEIGHT = 48;
const WEEKDAY_BAR_HEIGHT = 28;
const MONTH_BOTTOM_GAP = 12;
const EDGE_THRESHOLD = 3;
const EXTEND_BATCH = 12;

function computeLayout(windowWidth: number) {
  const usable = windowWidth - HORIZONTAL_PADDING * 2;
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
  const layout = useMemo(() => computeLayout(viewport.width), [viewport.width]);
  const { cellSize, rowHeight, monthHeight } = layout;
  const safeInitial = Math.min(Math.max(initialIndex, 0), Math.max(blocks.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeInitial);
  const scrollTopRef = useRef(0);
  const extendingPastRef = useRef(false);
  const extendingFutureRef = useRef(false);

  const onScroll = useCallback(
    (e: any) => {
      const top = e?.detail?.scrollTop ?? 0;
      scrollTopRef.current = top;
      const idx = Math.round(top / Math.max(monthHeight, 1));
      const clamped = Math.min(Math.max(idx, 0), blocks.length - 1);
      if (clamped !== activeIndex) setActiveIndex(clamped);
    },
    [activeIndex, blocks.length, monthHeight]
  );

  useEffect(() => {
    if (
      activeIndex <= EDGE_THRESHOLD &&
      !extendingPastRef.current &&
      onExtendPast
    ) {
      extendingPastRef.current = true;
      onExtendPast(EXTEND_BATCH);
    } else if (
      activeIndex >= blocks.length - 1 - EDGE_THRESHOLD &&
      !extendingFutureRef.current &&
      onExtendFuture
    ) {
      extendingFutureRef.current = true;
      onExtendFuture(EXTEND_BATCH);
    }
  }, [activeIndex, blocks.length, onExtendPast, onExtendFuture]);

  const scrollToToday = useCallback(() => {
    const safe = Math.min(Math.max(todayIndex, 0), Math.max(blocks.length - 1, 0));
    const top = safe * monthHeight;
    try {
      Taro.pageScrollTo({ scrollTop: top, duration: 300 });
    } catch {
      /* not all platforms support pageScrollTo */
    }
  }, [todayIndex, blocks.length, monthHeight]);

  const showTodayButton = activeIndex !== todayIndex;
  const direction = activeIndex < todayIndex ? '↓' : '↑';

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
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
          <View
            key={w}
            style={{ flex: 1, alignItems: 'center' }}
          >
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
      <ScrollView
        scrollY
        enhanced
        showScrollbar={false}
        onScroll={onScroll}
        style={{ flex: 1 }}
      >
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
      </ScrollView>
      {showTodayButton && (
        <View
          onClick={scrollToToday}
          style={{
            position: 'fixed',
            right: '32rpx',
            bottom: '32rpx',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: '24rpx',
            paddingRight: '24rpx',
            paddingTop: '16rpx',
            paddingBottom: '16rpx',
            borderRadius: '40rpx',
            backgroundColor: '#1A1A1A',
            boxShadow: '0 8rpx 16rpx rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          <Text
            style={{
              color: '#FAFAFA',
              fontSize: '28rpx',
              fontWeight: '600',
              marginRight: '8rpx',
            }}
          >
            {direction}
          </Text>
          <Text
            style={{
              color: '#FAFAFA',
              fontSize: '26rpx',
              fontWeight: '600',
              letterSpacing: '1rpx',
            }}
          >
            今天
          </Text>
        </View>
      )}
    </View>
  );
}
