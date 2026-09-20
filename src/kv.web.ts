/**
 * Web fallback for kv.ts. localStorage is readable by any script on the
 * origin and is not encrypted at rest — acceptable only for the dev preview,
 * which is why the app shows a permanent banner saying so.
 */
const memory = new Map<string, string>();

function store(): Storage | null {
  try {
    // Private browsing / disabled site data both throw here.
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const s = store();
  if (!s) return memory.get(key) ?? null;
  try {
    return s.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export async function kvSet(key: string, value: string): Promise<void> {
  const s = store();
  memory.set(key, value);
  try {
    s?.setItem(key, value);
  } catch {
    /* quota or blocked storage: the in-memory copy still serves this session */
  }
}

export async function kvDelete(key: string): Promise<void> {
  const s = store();
  memory.delete(key);
  try {
    s?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const KV_IS_SECURE = false;
