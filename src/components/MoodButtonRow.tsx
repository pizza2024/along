import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MoodButton } from './MoodButton';
import { EMOTIONS } from '@/constants/emotions';
import type { EmotionKey } from '@/types';

interface Props {
  buttonSize: number;
  onRecord: (k: EmotionKey) => Promise<void>;
}

export function MoodButtonRow({ buttonSize, onRecord }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {EMOTIONS.map((e) => (
        <MoodButton key={e.key} emotionKey={e.key} size={buttonSize} onRecord={onRecord} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
});
