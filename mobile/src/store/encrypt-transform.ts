import CryptoJS from 'crypto-js';
import { createTransform } from 'redux-persist';

/**
 * AES transform for redux-persist: slices are encrypted at rest and
 * decrypted on rehydration. A corrupted/tampered payload yields `undefined`
 * so the slice falls back to its initial state instead of crashing.
 */
export function createEncryptTransform(secretKey: string) {
  return createTransform(
    inboundState =>
      CryptoJS.AES.encrypt(JSON.stringify(inboundState), secretKey).toString(),
    outboundState => {
      try {
        const bytes = CryptoJS.AES.decrypt(String(outboundState), secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
          return undefined;
        }
        return JSON.parse(decrypted) as unknown;
      } catch {
        return undefined;
      }
    },
  );
}
