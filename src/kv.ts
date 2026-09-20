import * as SecureStore from 'expo-secure-store';

/**
 * Small key/value store for things that must survive a restart but do not
 * belong in the database (the database key itself, mostly).
 *
 * Native: the OS keystore, via expo-secure-store.
 * Web: see kv.web.ts — localStorage, which is NOT secure. Web is a dev preview.
 */
export async function kvGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function kvSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function kvDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/** True when secrets are held by the OS keystore rather than the browser. */
export const KV_IS_SECURE = true;
