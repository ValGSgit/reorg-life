import { webcrypto } from 'node:crypto';

/**
 * Stand-in for the AES surface of `expo-crypto`, backed by Node's WebCrypto.
 *
 * This is a real implementation, not a stub: the same AES-256-GCM, the same
 * IV and tag layout. That matters, because the behaviour under test is
 * precisely that a wrong key or a tampered file *fails authentication*. A
 * fake that just compared keys would pass while the real thing was broken.
 *
 * expo-crypto's own web build does the same thing over the same API, so this
 * mirrors production on web closely and production on native semantically.
 */

const subtle = webcrypto.subtle;
const IV_BYTES = 12;
const TAG_BYTES = 16;

const toBytes = (input: string | Uint8Array | ArrayBuffer): Uint8Array => {
  if (typeof input === 'string') return Uint8Array.from(Buffer.from(input, 'base64'));
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return input;
};

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

export class AESEncryptionKey {
  constructor(
    private readonly raw: Uint8Array,
    private readonly cryptoKey: CryptoKey,
  ) {}

  get size() {
    return this.raw.length * 8;
  }

  static async generate(bits = 256): Promise<AESEncryptionKey> {
    const raw = webcrypto.getRandomValues(new Uint8Array(bits / 8));
    return AESEncryptionKey.import(raw);
  }

  static async import(input: Uint8Array | string, encoding?: 'hex' | 'base64'): Promise<AESEncryptionKey> {
    const raw =
      typeof input === 'string'
        ? Uint8Array.from(Buffer.from(input, encoding === 'hex' ? 'hex' : 'base64'))
        : input;
    if (![16, 24, 32].includes(raw.length)) {
      throw new Error(`invalid AES key length: ${raw.length} bytes`);
    }
    const key = await subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    return new AESEncryptionKey(raw, key);
  }

  async bytes(): Promise<Uint8Array> {
    return this.raw;
  }

  async encoded(encoding: 'hex' | 'base64'): Promise<string> {
    return Buffer.from(this.raw).toString(encoding === 'hex' ? 'hex' : 'base64');
  }

  /** @internal */
  get key(): CryptoKey {
    return this.cryptoKey;
  }
}

export class AESSealedData {
  constructor(private readonly bytes: Uint8Array) {}

  static fromCombined(combined: string | Uint8Array | ArrayBuffer): AESSealedData {
    const bytes = toBytes(combined);
    if (bytes.length < IV_BYTES + TAG_BYTES) throw new Error('sealed data too short');
    return new AESSealedData(bytes);
  }

  static fromParts(iv: string | Uint8Array, ciphertextWithTag: string | Uint8Array): AESSealedData {
    const a = toBytes(iv);
    const b = toBytes(ciphertextWithTag);
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return new AESSealedData(out);
  }

  get ivSize() {
    return IV_BYTES;
  }
  get tagSize() {
    return TAG_BYTES;
  }
  get combinedSize() {
    return this.bytes.length;
  }

  async iv(encoding?: 'bytes' | 'base64') {
    const v = this.bytes.slice(0, IV_BYTES);
    return encoding === 'base64' ? b64(v) : v;
  }

  async ciphertext(options?: { includeTag?: boolean; encoding?: 'bytes' | 'base64' }) {
    const withTag = this.bytes.slice(IV_BYTES);
    const v = options?.includeTag === false ? withTag.slice(0, -TAG_BYTES) : withTag;
    return options?.encoding === 'base64' ? b64(v) : v;
  }

  async tag(encoding?: 'bytes' | 'base64') {
    const v = this.bytes.slice(-TAG_BYTES);
    return encoding === 'base64' ? b64(v) : v;
  }

  async combined(encoding?: 'bytes' | 'base64') {
    return encoding === 'base64' ? b64(this.bytes) : this.bytes;
  }
}

export async function aesEncryptAsync(
  plaintext: string | Uint8Array | ArrayBuffer,
  key: AESEncryptionKey,
): Promise<AESSealedData> {
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8 }, key.key, toBytes(plaintext)),
  );
  return AESSealedData.fromParts(iv, ct);
}

export async function aesDecryptAsync(
  sealed: AESSealedData,
  key: AESEncryptionKey,
  options?: { output?: 'bytes' | 'base64' },
): Promise<string | Uint8Array> {
  const iv = (await sealed.iv()) as Uint8Array;
  const ct = (await sealed.ciphertext()) as Uint8Array;
  const plain = new Uint8Array(
    await subtle.decrypt({ name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8 }, key.key, ct),
  );
  return options?.output === 'base64' ? b64(plain) : plain;
}

export function getRandomBytes(n: number): Uint8Array {
  return webcrypto.getRandomValues(new Uint8Array(n));
}
