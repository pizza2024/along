import { createWxStorageAdapter } from '@/db/wxStorageAdapter';
import type { DbAdapter } from '@/db/types';

let _adapter: DbAdapter | null = null;

export async function getDb(): Promise<DbAdapter> {
  if (_adapter) return _adapter;
  const adapter = createWxStorageAdapter();
  await adapter.init();
  _adapter = adapter;
  return _adapter;
}

export function __setAdapter(a: DbAdapter | null) {
  _adapter = a;
}
