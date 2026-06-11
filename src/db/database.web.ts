import { createInMemoryAdapter, type DbAdapter } from './index';

let _adapter: DbAdapter | null = null;

export async function getDb(): Promise<DbAdapter> {
  if (_adapter) return _adapter;
  const adapter = createInMemoryAdapter();
  await adapter.init();
  _adapter = adapter;
  return _adapter;
}

export function __setAdapter(a: DbAdapter | null) {
  _adapter = a;
}
