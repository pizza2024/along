import React, { useCallback } from 'react';
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
// 固定计算：(750 - 48*2 - 24*3) / 4 = 145
const BUTTON_WIDTH_RPX = 145;

export function MoodPickerSheet({ visible, date, onClose, onRecord }: Props) {
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

  const rows = Math.ceil(EMOTIONS.length / 4);

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
        {/* Drag handle */}
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
        {/* Title — 用 View 包裹确保居中 */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: '16rpx',
          }}
        >
          <Text
            style={{
              fontSize: '36rpx',
              fontWeight: '600',
              color: '#1A1A1A',
            }}
          >
            {formatDate(date)}
          </Text>
        </View>
        <ScrollView
          scrollY
          style={{ height: `${SHEET_HEIGHT_RPX - 160}rpx` }}
          showScrollbar={false}
        >
          <View
            style={{
              paddingLeft: `${GRID_PADDING_RPX}rpx`,
              paddingRight: `${GRID_PADDING_RPX}rpx`,
              paddingBottom: `${GRID_PADDING_RPX}rpx`,
            }}
          >
            {Array.from({ length: rows }, (_, row) => (
              <View
                key={row}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: row < rows - 1 ? `${GRID_GAP_RPX}rpx` : 0,
                }}
              >
                {EMOTIONS.slice(row * 4, row * 4 + 4).map((emotion) => (
                  <View
                    key={emotion.key}
                    onClick={() => handleRecord(emotion.key)}
                    style={{
                      width: `${BUTTON_WIDTH_RPX}rpx`,
                      height: `${BUTTON_HEIGHT_RPX}rpx`,
                      display: 'flex',
                      flexDirection: 'column',
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
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
