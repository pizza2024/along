import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ProgressRing } from './ProgressRing';
import { useLongPress } from '@/hooks/useLongPress';
import { EMOTION_MAP } from '@/constants/emotions';
import { useMoodStore } from '@/store/moodStore';
import type { EmotionKey } from '@/types';

interface Props {
  emotionKey: EmotionKey;
  size: number;
  onRecord: (k: EmotionKey) => Promise<void>;
}

export function MoodButton({ emotionKey, size, onRecord }: Props) {
  const e = EMOTION_MAP[emotionKey];
  const [progress, setProgress] = useState(0);
  const selected = useMoodStore((s) => s.selectedEmotion);
  const setSelected = useMoodStore((s) => s.setSelectedEmotion);

  const handleComplete = useCallback(async () => {
    await onRecord(emotionKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setProgress(0);
  }, [emotionKey, onRecord]);

  const lp = useLongPress({
    duration: 800,
    onProgress: setProgress,
    onComplete: handleComplete,
  });

  return (
    <Pressable
      onPress={() => setSelected(emotionKey)}
      onPressIn={lp.onPressIn}
      onPressOut={lp.onPressOut}
      style={({ pressed }) => [
        styles.touch,
        { width: size, height: size },
        pressed && styles.pressed,
      ]}
    >
      <ProgressRing size={size} strokeWidth={4} progress={progress} color={e.color}>
        <View
          style={[
            styles.square,
            {
              backgroundColor: e.color,
              borderColor: selected === emotionKey ? '#222' : 'transparent',
            },
          ]}
        />
      </ProgressRing>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  square: { width: '70%', height: '70%', borderRadius: 14, borderWidth: 2 },
});
