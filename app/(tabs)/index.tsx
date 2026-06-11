import React from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VirtualizedMoodCalendar } from '@/components/VirtualizedMoodCalendar';
import { MoodButtonRow } from '@/components/MoodButtonRow';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useMoodStore } from '@/store/moodStore';
import { EMOTION_MAP } from '@/constants/emotions';

export default function Home() {
  const { blocks, currentMonthIndex, addEmotion, extendPast, extendFuture } = useCalendarData();
  const mode = useMoodStore((s) => s.mode);
  const toggleMode = useMoodStore((s) => s.toggleMode);
  const selected = useMoodStore((s) => s.selectedEmotion);
  const selectedMeta = EMOTION_MAP[selected];
  const { width } = Dimensions.get('window');
  const buttonSize = Math.min(88, Math.floor((width - 24) / 8));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Moodly</Text>
          <View style={styles.selectedChip}>
            <View style={[styles.selectedDot, { backgroundColor: selectedMeta.color }]} />
            <Text style={styles.selectedLabel}>{selectedMeta.label}</Text>
          </View>
        </View>
        <Pressable
          onPress={toggleMode}
          hitSlop={12}
          style={({ pressed }) => [styles.modeButton, pressed && styles.pressed]}
        >
          <Text style={styles.modeIcon}>{mode === 'aggregate' ? '◧' : '◨'}</Text>
          <Text style={styles.modeHint}>
            {mode === 'aggregate' ? '全部' : '仅此情绪'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.calendarWrap}>
        <VirtualizedMoodCalendar
          blocks={blocks}
          initialIndex={currentMonthIndex}
          todayIndex={currentMonthIndex}
          onExtendPast={extendPast}
          onExtendFuture={extendFuture}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.buttonsWrap}>
        <MoodButtonRow buttonSize={buttonSize} onRecord={addEmotion} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.4,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  selectedDot: { width: 8, height: 8, borderRadius: 4 },
  selectedLabel: { fontSize: 12, color: '#555', fontWeight: '500' },
  modeButton: { alignItems: 'center', padding: 4, gap: 2 },
  pressed: { opacity: 0.6 },
  modeIcon: { fontSize: 20, color: '#666' },
  modeHint: { fontSize: 10, color: '#999', letterSpacing: 0.5 },
  calendarWrap: { flex: 3 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 24,
  },
  buttonsWrap: { flex: 1, justifyContent: 'center' },
});
