import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { VirtualizedMoodCalendar } from '@/components/VirtualizedMoodCalendar';
import { MoodPickerSheet } from '@/components/MoodPickerSheet';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useMoodStore } from '@/store/moodStore';
import { EMOTION_MAP } from '@moodly/shared';
import type { EmotionKey } from '@moodly/shared';

export default function Home() {
  const { blocks, currentMonthIndex, addEmotion, extendPast, extendFuture } = useCalendarData();
  const mode = useMoodStore((s) => s.mode);
  const toggleMode = useMoodStore((s) => s.toggleMode);
  const selected = useMoodStore((s) => s.selectedEmotion);
  const setSelected = useMoodStore((s) => s.setSelectedEmotion);
  const selectedMeta = EMOTION_MAP[selected];

  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [width, setWidth] = useState(375);

  useEffect(() => {
    try { setWidth(Taro.getSystemInfoSync().windowWidth); } catch { /* */ }
  }, []);

  const handleDayPress = useCallback((date: string) => {
    setSheetDate(date);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetDate(null);
  }, []);

  const handleRecord = useCallback(
    async (emotion: EmotionKey) => {
      if (!sheetDate) return;
      await addEmotion(emotion, sheetDate);
      setSelected(emotion);
    },
    [sheetDate, addEmotion, setSelected]
  );

  const headerH = Math.round(140 * (width / 750));

  return (
    <View style={{ backgroundColor: '#FAFAFA', minHeight: '100vh', paddingTop: `${headerH}px` }}>
      {/* Fixed header */}
      <View
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FAFAFA',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingLeft: '48rpx',
          paddingRight: '48rpx',
          paddingTop: '32rpx',
          paddingBottom: '24rpx',
        }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: '48rpx', fontWeight: '600', color: '#1A1A1A', letterSpacing: '1rpx' }}>
            Moodly
          </Text>
          <View
            style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              marginLeft: '24rpx', paddingLeft: '16rpx', paddingRight: '16rpx',
              paddingTop: '8rpx', paddingBottom: '8rpx', borderRadius: '24rpx',
              backgroundColor: '#F0F0F0',
            }}
          >
            <View style={{ width: '16rpx', height: '16rpx', borderRadius: '8rpx', backgroundColor: selectedMeta.color, marginRight: '12rpx' }} />
            <Text style={{ fontSize: '24rpx', color: '#555', fontWeight: '500' }}>
              {selectedMeta.label}
            </Text>
          </View>
        </View>
        <View onClick={toggleMode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8rpx' }}>
          <Text style={{ fontSize: '40rpx', color: '#666' }}>
            {mode === 'aggregate' ? '◧' : '◨'}
          </Text>
          <Text style={{ fontSize: '20rpx', color: '#999', letterSpacing: '1rpx', marginTop: '4rpx' }}>
            {mode === 'aggregate' ? '全部' : '仅此情绪'}
          </Text>
        </View>
      </View>

      {/* Calendar */}
      <VirtualizedMoodCalendar
        blocks={blocks}
        initialIndex={currentMonthIndex}
        todayIndex={currentMonthIndex}
        onExtendPast={extendPast}
        onExtendFuture={extendFuture}
        onDayPress={handleDayPress}
      />

      <MoodPickerSheet
        visible={sheetDate !== null}
        date={sheetDate ?? ''}
        onClose={handleCloseSheet}
        onRecord={handleRecord}
      />
    </View>
  );
}
