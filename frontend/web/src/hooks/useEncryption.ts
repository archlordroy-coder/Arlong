import { useState, useCallback } from 'react';
import { encryptFile, decryptFile } from '../utils/crypto';

export const useEncryption = () => {
  const [encryptionKey, setEncryptionKey] = useState<string | null>(() => {
    return localStorage.getItem('mboadrive_encryption_key');
  });

  const saveKey = useCallback((key: string) => {
    localStorage.setItem('mboadrive_encryption_key', key);
    setEncryptionKey(key);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem('mboadrive_encryption_key');
    setEncryptionKey(null);
  }, []);

  // Encrypt only if key is configured, otherwise return file as-is
  const encrypt = useCallback(async (file: File | Blob) => {
    if (!encryptionKey) {
      console.log('⚠️ Pas de clé de chiffrement - upload sans chiffrement');
      return file; // Return file unchanged if no encryption key
    }
    return encryptFile(file, encryptionKey);
  }, [encryptionKey]);

  // Decrypt only if key is configured, otherwise return blob as-is
  const decrypt = useCallback(async (blob: Blob) => {
    if (!encryptionKey) {
      console.log('⚠️ Pas de clé de chiffrement - fichier non chiffré');
      return blob; // Return blob unchanged if no encryption key
    }
    return decryptFile(blob, encryptionKey);
  }, [encryptionKey]);

  return {
    encryptionKey,
    saveKey,
    clearKey,
    encrypt,
    decrypt,
    isConfigured: !!encryptionKey
  };
};
