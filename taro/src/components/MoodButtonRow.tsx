import React, { useCallback, useMemo } from 'react';
import { ScrollView, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MoodButton } from './MoodButton';
import { EMOTIONS } from '@/constants/emotions';

type EmotionKey = import('@/types').EmotionKey;

interface Props {
  buttonSize: number;
  onRecord: (k: EmotionKey) => Promise<void>;
}

const ROW_GAP_RPX = 8;
const ROW_PADDING_RPX = 12;

export function MoodButtonRow({ buttonSize, onRecord }: Props) {
  const data = useMemo(() => EMOTIONS.map((e) => e.key), []);
  const lastIdx = data.length - 1;

  const onScroll = useCallback((e: any) => {
    const detail = e && e.detail;
    if (!detail) return;
    const ratio = Math.abs(detail.deltaX || 0);
    if (ratio > 4) {
      try {
        Taro.vibrateShort({ type: 'light' });
      } catch {
        /* no haptics in devtools */
      }
    }
  }, []);

  return (
    <ScrollView
      scrollX
      enhanced
      showScrollbar={false}
      onScroll={onScroll}
      style={{ width: '100%' }}
    >
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: `${ROW_PADDING_RPX}rpx`,
          paddingRight: `${ROW_PADDING_RPX}rpx`,
        }}
      >
        {data.map((key, i) => (
          <View
            key={key}
            style={{
              marginRight: i === lastIdx ? 0 : ROW_GAP_RPX,
            }}
          >
            <MoodButton emotionKey={key} size={buttonSize} onRecord={onRecord} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
