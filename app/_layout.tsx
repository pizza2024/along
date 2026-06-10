import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { getDb } from '@/db/database';

export default function RootLayout() {
  useEffect(() => {
    getDb().catch((err) => {
      // Logged but not blocking UI
      console.warn('[moodly] db init failed', err);
    });
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
}
