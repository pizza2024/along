import React, { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { EMOTIONS, EMOTION_MAP } from '@/constants/emotions';
import type { EmotionKey, MoodEntry } from '@/types';

interface Props {
  visible: boolean;
  date: string;
  entries: MoodEntry[];
  onClose: () => void;
  onRecord: (emotion: EmotionKey) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const SHEET_HEIGHT = 380;
const DRAG_HANDLE_HEIGHT = 44;
const GRID_GAP = 12;
const GRID_PADDING = 24;
const BUTTON_HEIGHT = 96;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

export function MoodPickerSheet({ visible, date, entries, onClose, onRecord, onDelete }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const buttonWidth = Math.floor((width - GRID_PADDING * 2 - GRID_GAP * 3) / 4);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const hiddenY = SHEET_HEIGHT + insets.bottom;

  const animateOpen = useCallback(() => {
    translateY.setValue(hiddenY);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, backdropOpacity, hiddenY]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: hiddenY,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [translateY, backdropOpacity, hiddenY, onClose]);

  useEffect(() => {
    if (visible) {
      animateOpen();
    }
  }, [visible, animateOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          backdropOpacity.setValue(Math.max(0, 1 - gestureState.dy / SHEET_HEIGHT));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleRecord = useCallback(
    async (emotion: EmotionKey) => {
      try {
        await onRecord(emotion);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      } finally {
        animateClose();
      }
    },
    [onRecord, animateClose]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await onDelete(id);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
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

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={animateClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdropPress} onPress={animateClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>
        <Animated.View
          style={[
            styles.sheet,
            { height: SHEET_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handleBar} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.title}>{formatDate(date)}</Text>
          {entries.length > 0 && (
            <View style={styles.entriesWrap}>
              {entries.map((entry) => {
                const meta = EMOTION_MAP[entry.emotion];
                return (
                  <View key={entry.id} style={styles.entryChip}>
                    <View style={[styles.entryDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.entryLabel}>{meta.label}</Text>
                    <Text style={styles.entryTime}>{formatTime(entry.createdAt)}</Text>
                    <Pressable
                      onPress={() => handleDelete(entry.id)}
                      hitSlop={8}
                      style={({ pressed }) => [styles.entryDelete, pressed && styles.pressed]}
                    >
                      <Text style={styles.entryDeleteText}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: GRID_PADDING }}
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: Math.ceil(EMOTIONS.length / 4) }, (_, row) => (
              <View key={row} style={[styles.row, { marginBottom: row === 0 ? GRID_GAP : 0 }]}>
                {EMOTIONS.slice(row * 4, row * 4 + 4).map((emotion) => (
                  <Pressable
                    key={emotion.key}
                    onPress={() => handleRecord(emotion.key)}
                    style={({ pressed }) => [
                      styles.button,
                      {
                        width: buttonWidth,
                        height: BUTTON_HEIGHT,
                        backgroundColor: `${emotion.color}18`,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.colorBlock,
                        { backgroundColor: emotion.color },
                      ]}
                    />
                    <Text style={styles.label}>{emotion.label}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  entriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: GRID_PADDING,
    marginBottom: 12,
  },
  entryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F4F4F4',
  },
  entryDot: { width: 8, height: 8, borderRadius: 4 },
  entryLabel: { fontSize: 13, fontWeight: '500', color: '#333' },
  entryTime: { fontSize: 12, color: '#999' },
  entryDelete: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4E4E4',
  },
  entryDeleteText: { fontSize: 13, lineHeight: 16, color: '#777' },
  pressed: { opacity: 0.6 },
  handleBar: {
    height: DRAG_HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D1D1',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  colorBlock: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
});
