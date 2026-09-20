import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import { exportSnapshot, importSnapshot, type Snapshot } from './db/repo';

/**
 * Encrypted export and import.
 *
 * A backup is AES-256-GCM over the whole dataset. The key is generated fresh
 * for each export and shown to you once as a recovery key — it is never stored
 * anywhere and never travels with the file, so a backup that leaks is just
 * noise without it. Losing the key means losing the backup; that is the trade
 * for not having a passphrase weak enough to guess.
 */

export const BACKUP_FORMAT = 'reorglife-backup';
export const BACKUP_VERSION = 1;

export type Bundle = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: Snapshot;
};

// Hermes does not guarantee TextEncoder, and btoa is latin1-only, so the two
// conversions the crypto API needs are done by hand.
function utf8Encode(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const next = s.charCodeAt(i + 1);
      c = 0x10000 + ((c - 0xd800) << 10) + (next - 0xdc00);
      i++;
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

function utf8Decode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    if (b < 0x80) {
      s += String.fromCharCode(b);
      i += 1;
    } else if (b < 0xe0) {
      s += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (b < 0xf0) {
      s += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else {
      const cp =
        ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      const off = cp - 0x10000;
      s += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
      i += 4;
    }
  }
  return s;
}

export type ExportResult = {
  /** The file contents: base64 of IV + ciphertext + tag. */
  payload: string;
  /** Base64 recovery key. Shown once; not stored. */
  recoveryKey: string;
  /** Suggested filename. */
  filename: string;
};

/** Gathers everything and seals it. Nothing leaves the device. */
export async function createBackup(): Promise<ExportResult> {
  const bundle: Bundle = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: await exportSnapshot(),
  };
  const key = await AESEncryptionKey.generate();
  const sealed = await aesEncryptAsync(utf8Encode(JSON.stringify(bundle)), key);
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    payload: await sealed.combined('base64'),
    recoveryKey: await key.encoded('base64'),
    filename: `reorglife-${stamp}.backup`,
  };
}

export class BackupError extends Error {}

/**
 * Restores a backup, replacing what is on the device. Fails loudly and
 * without touching the database if the key is wrong or the file is not ours.
 */
export async function restoreBackup(payload: string, recoveryKey: string): Promise<Snapshot> {
  const trimmedKey = recoveryKey.trim();
  const trimmedPayload = payload.trim();
  if (!trimmedPayload) throw new BackupError('That file looks empty.');
  if (!trimmedKey) throw new BackupError('A recovery key is needed to open this backup.');

  let key: AESEncryptionKey;
  try {
    key = await AESEncryptionKey.import(trimmedKey, 'base64');
  } catch {
    throw new BackupError('That recovery key is not in the right shape. It should be the long line of characters shown when you exported.');
  }

  let json: string;
  try {
    const sealed = AESSealedData.fromCombined(trimmedPayload);
    const bytes = await aesDecryptAsync(sealed, key, { output: 'bytes' });
    json = utf8Decode(bytes);
  } catch {
    // AES-GCM authenticates, so a wrong key and a damaged file look the same.
    throw new BackupError('Could not open this backup. The key may not match this file, or the file may be damaged.');
  }

  let bundle: Bundle;
  try {
    bundle = JSON.parse(json);
  } catch {
    throw new BackupError('This backup could not be read.');
  }
  if (bundle?.format !== BACKUP_FORMAT) throw new BackupError('That is not a ReorgLife backup.');
  if (typeof bundle.version !== 'number' || bundle.version > BACKUP_VERSION) {
    throw new BackupError('This backup was made by a newer version of the app.');
  }
  if (!bundle.data || typeof bundle.data !== 'object') throw new BackupError('This backup has no data in it.');

  await importSnapshot(bundle.data);
  return bundle.data;
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** A short, human-readable summary of what a restore brought back. */
export const describeSnapshot = (s: Snapshot): string =>
  [
    count(s.checkins?.length ?? 0, 'check-in', 'check-ins'),
    count(s.events?.length ?? 0, 'timeline entry', 'timeline entries'),
    count(s.habits?.length ?? 0, 'habit', 'habits'),
  ].join(', ');
