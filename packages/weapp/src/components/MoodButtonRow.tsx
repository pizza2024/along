import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MoodButton } from './MoodButton';
import { computeInfiniteWrap, buildInfiniteRows, shouldFireScrollHaptic, HAPTIC_THROTTLE_MS } from '@moodly/shared';
import { EMOTIONS } from '@moodly/shared';

type EmotionKey = import('@moodly/shared').EmotionKey;

interface Props {
  buttonSize: number;
  onRecord: (k: EmotionKey) => Promise<void>;
}

interface Row {
  uid: string;
  key: EmotionKey;
}

const REPEATS = 5;
const MIDDLE_COPY_INDEX = (REPEATS - 1) / 2;
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

  const copyLen = EMOTIONS.length;
  const step = buttonSize + ROW_GAP;
  const contentWidth = ROW_PADDING * 2 + step * copyLen * REPEATS;
  const startOffset = ROW_PADDING + step * copyLen * MIDDLE_COPY_INDEX;

  const [scrollLeft, setScrollLeft] = useState(startOffset);
  const scrollLeftRef = useRef(startOffset);
  const lastHapticAtRef = useRef<number | null>(null);
  const lastActiveIdxRef = useRef<number | null>(null);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWrappingRef = useRef(false);

  const wrapIfNeeded = useCallback((currentOffset: number) => {
    const result = computeInfiniteWrap(currentOffset, copyLen, step, ROW_PADDING, REPEATS);
    if (result.needsWrap && !isWrappingRef.current) {
      isWrappingRef.current = true;
      const nextOffset = result.nextOffset;
      setScrollLeft(nextOffset);
      scrollLeftRef.current = nextOffset;
      // Clear the wrap flag after the programmatic scroll settles
      setTimeout(() => {
        isWrappingRef.current = false;
      }, 80);
    }
  }, [copyLen, step]);

  const onScroll = useCallback((e: any) => {
    const detail = e && e.detail;
    if (!detail || typeof detail.scrollLeft !== 'number') return;
    const offsetX = detail.scrollLeft;
    scrollLeftRef.current = offsetX;

    // Fire haptic when crossing button boundaries
    if (buttonSize > 0) {
      const idx = Math.round((offsetX - ROW_PADDING) / step);
      const prev = lastActiveIdxRef.current;
      if (prev !== idx) {
        lastActiveIdxRef.current = idx;
        if (shouldFireScrollHaptic(prev, idx, Date.now(), lastHapticAtRef.current, HAPTIC_THROTTLE_MS)) {
          lastHapticAtRef.current = Date.now();
          try {
            Taro.vibrateShort({ type: 'light' });
          } catch {
            /* no haptics in devtools */
          }
        }
      }
    }

    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(() => {
      wrapIfNeeded(offsetX);
    }, 120);
  }, [buttonSize, step, wrapIfNeeded]);

  const onTouchEnd = useCallback(() => {
    // Wrap immediately when the user lifts their finger
    wrapIfNeeded(scrollLeftRef.current);
  }, [wrapIfNeeded]);

  return (
    <ScrollView
      scrollX
      enhanced
      showScrollbar={false}
      scrollLeft={scrollLeft}
      scrollWithAnimation={false}
      onScroll={onScroll}
      onTouchEnd={onTouchEnd}
      style={{ width: '100%' }}
    >
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: `${contentWidth}rpx`,
          paddingLeft: `${ROW_PADDING}rpx`,
          paddingRight: `${ROW_PADDING}rpx`,
        }}
      >
        {data.map((item, i) => (
          <View
            key={item.uid}
            style={{
              marginRight: i === data.length - 1 ? 0 : `${ROW_GAP}rpx`,
            }}
          >
            <MoodButton emotionKey={item.key} size={buttonSize} onRecord={onRecord} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
