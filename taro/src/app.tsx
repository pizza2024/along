import React, { useEffect } from 'react';
import { getDb } from '@/db/database';

export default function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getDb().catch((err) => {
      console.warn('[moodly] db init failed', err);
    });
  }, []);
  return <>{children}</>;
}
