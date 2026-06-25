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
import * as Haptics from 'expo-haptics';
import { EMOTIONS, EMOTION_MAP } from '@/constants/emotions';
import type { EmotionKey } from '@/types';

interface Props {
  visible: boolean;
  date: string;
  onClose: () => void;
  onRecord: (emotion: EmotionKey) => Promise<void>;
}

const SHEET_HEIGHT = 360;
const DRAG_HANDLE_HEIGHT = 44;
const GRID_GAP = 12;
const GRID_PADDING = 24;
const BUTTON_HEIGHT = 96;

export function MoodPickerSheet({ visible, date, onClose, onRecord }: Props) {
  const { width } = useWindowDimensions();
  const buttonWidth = Math.floor((width - GRID_PADDING * 2 - GRID_GAP * 3) / 4);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateOpen = useCallback(() => {
    translateY.setValue(SHEET_HEIGHT);
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
  }, [translateY, backdropOpacity]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
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
  }, [translateY, backdropOpacity, onClose]);

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

  const formatDate = useCallback((dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return `${y}年${m}月${d}日`;
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
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handleBar} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.title}>{formatDate(date)}</Text>
          <ScrollView
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
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
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
