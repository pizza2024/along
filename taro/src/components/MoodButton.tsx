import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ProgressRing } from './ProgressRing';
import { tickProgress } from '@/hooks/useLongPress';
import { EMOTION_MAP } from '@/constants/emotions';
import { useMoodStore } from '@/store/moodStore';

type EmotionKey = import('@/types').EmotionKey;

interface Props {
  emotionKey: EmotionKey;
  size: number;
  onRecord: (k: EmotionKey) => Promise<void>;
}

const LONG_PRESS_MS = 800;
const TICK_MS = 16;

export function MoodButton({ emotionKey, size, onRecord }: Props) {
  const e = EMOTION_MAP[emotionKey];
  const [progress, setProgress] = useState(0);
  const selected = useMoodStore((s) => s.selectedEmotion);
  const setSelected = useMoodStore((s) => s.setSelectedEmotion);

  const elapsedRef = useRef(0);
  const firedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insideRef = useRef(false);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPress = useCallback(() => {
    clearTick();
    firedRef.current = false;
    elapsedRef.current = 0;
    setProgress(0);
    intervalRef.current = setInterval(() => {
      elapsedRef.current += TICK_MS;
      const { done, progress: p } = tickProgress(elapsedRef.current, LONG_PRESS_MS);
      setProgress(p);
      if (done && !firedRef.current) {
        firedRef.current = true;
        clearTick();
        setProgress(0);
        onRecord(emotionKey)
          .then(() => {
            try {
              Taro.vibrateShort({ type: 'medium' });
            } catch {
              /* no haptics in devtools */
            }
          })
          .catch(() => {});
      }
    }, TICK_MS);
  }, [clearTick, emotionKey, onRecord]);

  const endPress = useCallback(() => {
    clearTick();
    elapsedRef.current = 0;
    setProgress(0);
  }, [clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  const onTouchStart = (ev: any) => {
    insideRef.current = true;
    startPress();
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
  };
  const onTouchEnd = () => {
    insideRef.current = false;
    endPress();
  };
  const onTouchCancel = () => {
    insideRef.current = false;
    endPress();
  };
  const onTap = () => {
    if (!firedRef.current) setSelected(emotionKey);
  };

  const innerSize = Math.round(size * 0.7);
  const radius = Math.max(8, Math.round(innerSize * 0.2));

  return (
    <View
      onClick={onTap}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <ProgressRing size={size} strokeWidth={4} progress={progress} color={e.color} />
      <View
        style={{
          width: `${innerSize}rpx`,
          height: `${innerSize}rpx`,
          borderRadius: `${radius}rpx`,
          backgroundColor: e.color,
          borderWidth: '2rpx',
          borderStyle: 'solid',
          borderColor: selected === emotionKey ? '#222' : 'transparent',
        }}
      />
    </View>
  );
}
