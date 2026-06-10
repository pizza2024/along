import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { getDb } from '@/db/database';

if (typeof console !== 'undefined') {
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('style.resizeMode is deprecated')) {
      return;
    }
    originalWarn(...args);
  };
}

export default function RootLayout() {
  useEffect(() => {
    getDb().catch((err) => {
      // Logged but not blocking UI
      console.warn('[moodly] db init failed', err);
    });
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
}
