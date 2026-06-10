// @ts-ignore - expo-sqlite native types; tree-shaken in node test env
import * as SQLite from 'expo-sqlite';
import { createSqliteAdapter, type DbAdapter } from './index';

let _adapter: DbAdapter | null = null;

export async function getDb(): Promise<DbAdapter> {
  if (_adapter) return _adapter;
  const db = await SQLite.openDatabaseAsync('moodly.db');
  const adapter = createSqliteAdapter(db);
  await adapter.init();
  _adapter = adapter;
  return _adapter;
}

export function __setAdapter(a: DbAdapter | null) {
  _adapter = a;
}
