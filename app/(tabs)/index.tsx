import React from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoodCalendar } from '@/components/MoodCalendar';
import { MoodButtonRow } from '@/components/MoodButtonRow';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useMoodStore } from '@/store/moodStore';

export default function Home() {
  const { cells, addEmotion } = useCalendarData();
  const mode = useMoodStore((s) => s.mode);
  const toggleMode = useMoodStore((s) => s.toggleMode);
  const { width } = Dimensions.get('window');
  const buttonSize = Math.min(72, Math.floor((width - 32) / 8));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Moodly</Text>
        <Pressable onPress={toggleMode} hitSlop={12} style={styles.modeButton}>
          <Text style={styles.modeIcon}>{mode === 'aggregate' ? '◧' : '◨'}</Text>
        </Pressable>
      </View>
      <View style={styles.calendarWrap}>
        <MoodCalendar cells={cells} />
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '600', color: '#222', letterSpacing: 0.5 },
  modeButton: { padding: 4 },
  modeIcon: { fontSize: 22, color: '#666' },
  calendarWrap: { flex: 3, justifyContent: 'center' },
  buttonsWrap: { flex: 1, justifyContent: 'center' },
});
