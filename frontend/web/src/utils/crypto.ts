/**
 * Utility for client-side encryption using the Web Crypto API.
 * Uses AES-256-GCM for authenticated encryption.
 */

const ALGORITHM = 'AES-256-GCM';
const IV_LENGTH = 12; // Standard for GCM
const SALT_LENGTH = 16;
const KEY_ITERATIONS = 100000;

/**
 * Derives an encryption key from a password and salt.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a File or Blob.
 */
export async function encryptFile(file: File | Blob, password: string): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const arrayBuffer = await file.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    arrayBuffer
  );

  // Combine Salt + IV + Encrypted Data
  const combined = new Blob([salt, iv, encryptedBuffer]);
  return combined;
}

/**
 * Decrypts a Blob back to an ArrayBuffer.
 */
export async function decryptFile(encryptedBlob: Blob, password: string): Promise<ArrayBuffer> {
  const combinedBuffer = await encryptedBlob.arrayBuffer();

  const salt = new Uint8Array(combinedBuffer.slice(0, SALT_LENGTH));
  const iv = new Uint8Array(combinedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
  const encryptedData = combinedBuffer.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );
    return decryptedBuffer;
  } catch (e) {
    throw new Error('Échec du déchiffrement. Le mot de passe est probablement incorrect.');
  }
}
