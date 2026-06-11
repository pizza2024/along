import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import type {
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MoodButton } from './MoodButton';
import { shouldFireScrollHaptic, HAPTIC_THROTTLE_MS } from '@/utils/scrollHaptic';
import { computeInfiniteWrap, buildInfiniteRows } from '@/utils/infiniteLoop';
import { EMOTIONS } from '@/constants/emotions';
import type { EmotionKey } from '@/types';

interface Props {
  buttonSize: number;
  onRecord: (k: EmotionKey) => Promise<void>;
}

interface Row {
  uid: string;
  key: EmotionKey;
}

const REPEATS = 3;
const ROW_GAP = 8;
const ROW_PADDING = 12;

export function MoodButtonRow({ buttonSize, onRecord }: Props) {
  const data = useMemo<Row[]>(
    () =>
      buildInfiniteRows(EMOTIONS, REPEATS, (e, copy) => `${copy}-${e.key}`).map(
        (r) => ({ uid: r.uid, key: r.item.key })
      ),
    []
  );

  const listRef = useRef<FlatList<Row>>(null);
  const lastHapticAtRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const lastActiveIdxRef = useRef<number | null>(null);
  const copyLen = EMOTIONS.length;
  const step = buttonSize + ROW_GAP;

  const onContentSizeChange = useCallback(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    listRef.current?.scrollToOffset({
      offset: ROW_PADDING + step * copyLen,
      animated: false,
    });
  }, [copyLen, step]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const result = computeInfiniteWrap(
        e.nativeEvent.contentOffset.x,
        copyLen,
        step,
        ROW_PADDING
      );
      if (result.needsWrap) {
        listRef.current?.scrollToOffset({
          offset: result.nextOffset,
          animated: false,
        });
      }
    },
    [copyLen, step]
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (buttonSize <= 0) return;
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round((offsetX - ROW_PADDING) / step);
      const prev = lastActiveIdxRef.current;
      if (prev === idx) return;
      lastActiveIdxRef.current = idx;
      if (Platform.OS !== 'web') {
        if (shouldFireScrollHaptic(prev, idx, Date.now(), lastHapticAtRef.current, HAPTIC_THROTTLE_MS)) {
          lastHapticAtRef.current = Date.now();
          Haptics.selectionAsync().catch(() => {});
        }
      }
    },
    [buttonSize, step]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Row>) => (
      <MoodButton emotionKey={item.key} size={buttonSize} onRecord={onRecord} />
    ),
    [buttonSize, onRecord]
  );

  const keyExtractor = useCallback((item: Row) => item.uid, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Row> | null | undefined, index: number) => ({
      length: buttonSize,
      offset: ROW_PADDING + step * index,
      index,
    }),
    [buttonSize, step]
  );

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      snapToAlignment="start"
      decelerationRate="fast"
      onScroll={onScroll}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={16}
      initialNumToRender={copyLen * 2}
      windowSize={5}
      maxToRenderPerBatch={copyLen}
      removeClippedSubviews
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: ROW_PADDING,
    alignItems: 'center',
    gap: ROW_GAP,
  },
});
