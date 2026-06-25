import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { EMOTIONS } from '@moodly/shared';
import type { EmotionKey } from '@moodly/shared';

interface Props {
  visible: boolean;
  date: string;
  onClose: () => void;
  onRecord: (emotion: EmotionKey) => Promise<void>;
}

const SHEET_HEIGHT_RPX = 720;
const GRID_GAP_RPX = 24;
const GRID_PADDING_RPX = 48;
const BUTTON_HEIGHT_RPX = 192;

export function MoodPickerSheet({ visible, date, onClose, onRecord }: Props) {
  const [buttonWidth, setButtonWidth] = useState(150);

  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync();
      const pxWidth = info.windowWidth;
      const rpxWidth = (pxWidth / info.windowWidth) * 750;
      const width = rpxWidth || 750;
      setButtonWidth(Math.floor((width - GRID_PADDING_RPX * 2 - GRID_GAP_RPX * 3) / 4));
    } catch {
      setButtonWidth(150);
    }
  }, []);

  const handleRecord = useCallback(
    async (emotion: EmotionKey) => {
      try {
        await onRecord(emotion);
        try {
          Taro.vibrateShort({ type: 'medium' });
        } catch {
          /* no haptics in devtools */
        }
      } finally {
        onClose();
      }
    },
    [onRecord, onClose]
  );

  const formatDate = useCallback((dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return `${y}年${m}月${d}日`;
  }, []);

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <View
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${SHEET_HEIGHT_RPX}rpx`,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '48rpx',
          borderTopRightRadius: '48rpx',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '88rpx',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: '80rpx',
              height: '10rpx',
              borderRadius: '5rpx',
              backgroundColor: '#D1D1D1',
            }}
          />
        </View>
        <Text
          style={{
            fontSize: '36rpx',
            fontWeight: '600',
            color: '#1A1A1A',
            textAlign: 'center',
            marginBottom: '16rpx',
          }}
        >
          {formatDate(date)}
        </Text>
        <ScrollView
          scrollY
          style={{ height: `${SHEET_HEIGHT_RPX - 160}rpx` }}
          showScrollbar={false}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingLeft: `${GRID_PADDING_RPX}rpx`,
              paddingRight: `${GRID_PADDING_RPX}rpx`,
              paddingBottom: `${GRID_PADDING_RPX}rpx`,
            }}
          >
            {EMOTIONS.map((emotion) => (
              <View
                key={emotion.key}
                onClick={() => handleRecord(emotion.key)}
                style={{
                  width: `${buttonWidth}rpx`,
                  height: `${BUTTON_HEIGHT_RPX}rpx`,
                  marginRight: `${GRID_GAP_RPX}rpx`,
                  marginBottom: `${GRID_GAP_RPX}rpx`,
                  borderRadius: '32rpx',
                  backgroundColor: `${emotion.color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: '88rpx',
                    height: '88rpx',
                    borderRadius: '24rpx',
                    backgroundColor: emotion.color,
                    marginBottom: '16rpx',
                  }}
                />
                <Text
                  style={{
                    fontSize: '28rpx',
                    fontWeight: '500',
                    color: '#333333',
                  }}
                >
                  {emotion.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
