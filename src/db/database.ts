import { Platform } from 'react-native';
import { createInMemoryAdapter, createSqliteAdapter, type DbAdapter } from './index';

let _adapter: DbAdapter | null = null;

export async function getDb(): Promise<DbAdapter> {
  if (_adapter) return _adapter;

  let adapter: DbAdapter;
  if (Platform.OS === 'web') {
    adapter = createInMemoryAdapter();
  } else {
    // @ts-ignore - expo-sqlite ships only the runtime on native; never evaluated on web
    const SQLite: { openDatabaseAsync(name: string): Promise<unknown> } = require('expo-sqlite');
    const db = (await SQLite.openDatabaseAsync('moodly.db')) as Parameters<typeof createSqliteAdapter>[0];
    adapter = createSqliteAdapter(db);
  }

  await adapter.init();
  _adapter = adapter;
  return _adapter;
}

export function __setAdapter(a: DbAdapter | null) {
  _adapter = a;
}
