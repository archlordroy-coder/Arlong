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

  const encrypt = useCallback(async (file: File | Blob) => {
    if (!encryptionKey) throw new Error('Aucune clé de chiffrement définie');
    return encryptFile(file, encryptionKey);
  }, [encryptionKey]);

  const decrypt = useCallback(async (blob: Blob) => {
    if (!encryptionKey) throw new Error('Aucune clé de chiffrement définie');
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
