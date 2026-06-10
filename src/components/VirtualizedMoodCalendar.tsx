import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { MonthGrid } from './MonthGrid';
import type { MonthBlock } from '@/hooks/useCalendarData';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

const HORIZONTAL_PADDING = 16;
const CELL_GAP = 3;
const ROW_COUNT = 6;
const HEADER_HEIGHT = 48;
const WEEKDAY_BAR_HEIGHT = 28;
const MONTH_BOTTOM_GAP = 12;
const EDGE_THRESHOLD = 3;
const EXTEND_BATCH = 12;

function computeLayout(viewportWidth: number) {
  const usable = viewportWidth - HORIZONTAL_PADDING * 2;
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
  const [viewport, setViewport] = useState(() => {
    const { width } = Dimensions.get('window');
    return { width, height: 0, ready: false };
  });

  const layout = useMemo(() => computeLayout(viewport.width), [viewport.width]);
  const { cellSize, rowHeight, monthHeight } = layout;

  const safeInitial = Math.min(Math.max(initialIndex, 0), Math.max(blocks.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeInitial);

  const listRef = useRef<FlatList<MonthBlock>>(null);
  const scrollOffsetRef = useRef(safeInitial * monthHeight);
  const prevFirstKeyRef = useRef<string | undefined>(undefined);
  const prevLengthRef = useRef(0);
  const extendingPastRef = useRef(false);
  const extendingFutureRef = useRef(false);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport((prev) => {
      if (prev.width === width && prev.height === height && prev.ready) return prev;
      return { width, height, ready: true };
    });
  }, []);

  const verticalPadding = viewport.ready
    ? Math.max(0, (viewport.height - monthHeight) / 2)
    : 0;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      scrollOffsetRef.current = offsetY;
      const idx = Math.round(offsetY / monthHeight);
      const clamped = Math.min(Math.max(idx, 0), blocks.length - 1);
      if (clamped !== activeIndex) setActiveIndex(clamped);
    },
    [activeIndex, blocks.length, monthHeight]
  );

  useEffect(() => {
    if (!viewport.ready) return;
    if (activeIndex <= EDGE_THRESHOLD && !extendingPastRef.current && onExtendPast) {
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
  }, [activeIndex, blocks.length, viewport.ready, onExtendPast, onExtendFuture]);

  useLayoutEffect(() => {
    const newLength = blocks.length;
    const newFirstKey = blocks[0]?.meta.key;
    const oldLength = prevLengthRef.current;
    const oldFirstKey = prevFirstKeyRef.current;

    if (
      oldFirstKey !== undefined &&
      oldFirstKey !== newFirstKey &&
      newLength > oldLength
    ) {
      const delta = newLength - oldLength;
      const newOffset = scrollOffsetRef.current + delta * monthHeight;
      scrollOffsetRef.current = newOffset;
      setActiveIndex((i) => i + delta);
      listRef.current?.scrollToOffset({ offset: newOffset, animated: false });
      extendingPastRef.current = false;
    } else if (newLength > oldLength) {
      extendingFutureRef.current = false;
    }

    prevFirstKeyRef.current = newFirstKey;
    prevLengthRef.current = newLength;
  }, [blocks, monthHeight]);

  const renderMonth = useCallback(
    ({ item, index }: ListRenderItemInfo<MonthBlock>) => (
      <View style={{ height: monthHeight }}>
        <MonthGrid
          block={item}
          cellSize={cellSize}
          cellGap={CELL_GAP}
          rowCount={ROW_COUNT}
          isActive={index === activeIndex}
          headerHeight={HEADER_HEIGHT}
          rowHeight={rowHeight}
          horizontalPadding={HORIZONTAL_PADDING}
        />
      </View>
    ),
    [activeIndex, cellSize, monthHeight, rowHeight]
  );

  const keyExtractor = useCallback((b: MonthBlock) => b.meta.key, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<MonthBlock> | null | undefined, index: number) => ({
      length: monthHeight,
      offset: monthHeight * index,
      index,
    }),
    [monthHeight]
  );

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: info.index, animated: false });
      });
    },
    []
  );

  const scrollToToday = useCallback(() => {
    const safeTodayIndex = Math.min(Math.max(todayIndex, 0), Math.max(blocks.length - 1, 0));
    listRef.current?.scrollToIndex({ index: safeTodayIndex, animated: true });
  }, [todayIndex, blocks.length]);

  const showTodayButton = viewport.ready && activeIndex !== todayIndex;
  const direction = activeIndex < todayIndex ? '↓' : '↑';

  return (
    <View style={styles.root} onLayout={onContainerLayout}>
      <View
        style={[styles.weekdayBar, { paddingHorizontal: HORIZONTAL_PADDING }]}
        pointerEvents="none"
      >
        {WEEKDAYS.map((w, i) => (
          <View key={w} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                (i === 0 || i === 6) && styles.weekdayWeekend,
              ]}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>
      {viewport.ready && (
        <FlatList
          ref={listRef}
          data={blocks}
          keyExtractor={keyExtractor}
          renderItem={renderMonth}
          getItemLayout={getItemLayout}
          initialScrollIndex={safeInitial}
          initialNumToRender={3}
          windowSize={5}
          maxToRenderPerBatch={3}
          removeClippedSubviews
          snapToInterval={monthHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          contentContainerStyle={{
            paddingTop: verticalPadding,
            paddingBottom: verticalPadding,
          }}
        />
      )}
      {showTodayButton && (
        <Pressable
          onPress={scrollToToday}
          hitSlop={8}
          style={({ pressed }) => [styles.todayBtn, pressed && styles.todayBtnPressed]}
        >
          <Text style={styles.todayBtnArrow}>{direction}</Text>
          <Text style={styles.todayBtnText}>今天</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  weekdayBar: {
    flexDirection: 'row',
    height: WEEKDAY_BAR_HEIGHT,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
  },
  weekdayWeekend: {
    color: '#B85C5C',
  },
  todayBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  todayBtnPressed: {
    opacity: 0.7,
  },
  todayBtnArrow: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
  todayBtnText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
