import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { EMOTIONS, EMOTION_MAP } from '@moodly/shared';
import type { EmotionKey, MoodEntry } from '@moodly/shared';

interface Props {
  visible: boolean;
  date: string;
  entries: MoodEntry[];
  onClose: () => void;
  onRecord: (emotion: EmotionKey) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const SHEET_HEIGHT_RPX = 760;
const GRID_GAP_RPX = 24;
const GRID_PADDING_RPX = 48;
const BUTTON_HEIGHT_RPX = 192;
// 固定计算：(750 - 48*2 - 24*3) / 4 = 145
const BUTTON_WIDTH_RPX = 145;
const ANIMATION_MS = 220;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

function vibrate(type: 'light' | 'medium') {
  try {
    Taro.vibrateShort({ type });
  } catch {
    /* no haptics in devtools */
  }
}

export function MoodPickerSheet({ visible, date, entries, onClose, onRecord, onDelete }: Props) {
  // rendered 控制挂载，open 控制过渡终态 —— 让关场动画跑完再 unmount
  const [rendered, setRendered] = useState(visible);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      const t = setTimeout(() => setOpen(true), 20);
      return () => clearTimeout(t);
    }
    setOpen(false);
    const t = setTimeout(() => setRendered(false), ANIMATION_MS);
    return () => clearTimeout(t);
  }, [visible]);

  const handleRecord = useCallback(
    async (emotion: EmotionKey) => {
      try {
        await onRecord(emotion);
        vibrate('medium');
      } finally {
        onClose();
      }
    },
    [onRecord, onClose]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await onDelete(id);
      vibrate('light');
    },
    [onDelete]
  );

  const formatDate = useCallback((dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
    return `${y}年${m}月${d}日 · 周${weekday}`;
  }, []);

  const formatTime = useCallback((ts: number) => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  if (!rendered) return null;

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
          opacity: open ? 1 : 0,
          transition: `opacity ${ANIMATION_MS}ms ease`,
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
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: `transform ${ANIMATION_MS}ms ease`,
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
        {entries.length > 0 && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingLeft: `${GRID_PADDING_RPX}rpx`,
              paddingRight: `${GRID_PADDING_RPX}rpx`,
              marginBottom: '24rpx',
            }}
          >
            {entries.map((entry) => {
              const meta = EMOTION_MAP[entry.emotion];
              return (
                <View
                  key={entry.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: '20rpx',
                    paddingRight: '12rpx',
                    paddingTop: '12rpx',
                    paddingBottom: '12rpx',
                    borderRadius: '32rpx',
                    backgroundColor: '#F4F4F4',
                    marginRight: '16rpx',
                    marginBottom: '16rpx',
                  }}
                >
                  <View
                    style={{
                      width: '16rpx',
                      height: '16rpx',
                      borderRadius: '8rpx',
                      backgroundColor: meta.color,
                      marginRight: '12rpx',
                    }}
                  />
                  <Text style={{ fontSize: '26rpx', fontWeight: '500', color: '#333', marginRight: '12rpx' }}>
                    {meta.label}
                  </Text>
                  <Text style={{ fontSize: '24rpx', color: '#999', marginRight: '12rpx' }}>
                    {formatTime(entry.createdAt)}
                  </Text>
                  <View
                    onClick={() => handleDelete(entry.id)}
                    style={{
                      width: '40rpx',
                      height: '40rpx',
                      borderRadius: '20rpx',
                      backgroundColor: '#E4E4E4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: '26rpx', lineHeight: '32rpx', color: '#777' }}>×</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <ScrollView
          scrollY
          style={{ height: `${SHEET_HEIGHT_RPX - 160 - (entries.length > 0 ? 100 : 0)}rpx` }}
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
