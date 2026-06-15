import { useState, useEffect } from 'react';
import { getAllKeys, trackKeyUsage, SecretKeyRecord } from '../utils/vaultManager';
import { decryptWithWebCrypto } from '../utils/encryption';

interface SmartKeyResult {
  key: string | null;
  error: string | null;
  loading: boolean;
  record: SecretKeyRecord | null;
}

/**
 * Custom React Hook that fetches, decrypts, and automatically tracks key usages
 */
export function useSmartKey(
  platformName: string,
  keyType: string = 'API_KEY',
  usedInPage: string = 'API Hook',
  usedInComponent: string = 'useSmartKey'
): SmartKeyResult {
  const [result, setResult] = useState<SmartKeyResult>({
    key: null,
    error: null,
    loading: true,
    record: null
  });

  useEffect(() => {
    let active = true;

    async function fetchAndSetup() {
      try {
        const keys = await getAllKeys();
        
        // Filter by platform, keyType, and verify active status (active or low credits)
        const candidates = keys.filter(
          k =>
            k.platform.toLowerCase() === platformName.toLowerCase() &&
            k.key_type.toLowerCase() === keyType.toLowerCase() &&
            (k.status === 'active' || k.status === 'low')
        );

        if (candidates.length === 0) {
          if (active) {
            setResult({
              key: null,
              error: `No active key found in vault for platform '${platformName}' with type '${keyType}'.`,
              loading: false,
              record: null
            });
          }
          return;
        }

        // Sort by balance descending to find the best key
        candidates.sort((a, b) => b.balance - a.balance);
        const bestKeyRecord = candidates[0];

        // Retrieve master passkey
        const masterPass = sessionStorage.getItem('dynamic_vault_auth_token') || 'Eissa2026';
        
        // Decrypt decrypted value
        const decryptedVal = await decryptWithWebCrypto(bestKeyRecord.encrypted_value, masterPass);
        
        if (!decryptedVal) {
          if (active) {
            setResult({
              key: null,
              error: 'Failed to decrypt credentials using master password key.',
              loading: false,
              record: bestKeyRecord
            });
          }
          return;
        }

        // Log and track usage in DB/LocalStorage
        await trackKeyUsage(bestKeyRecord.id, usedInPage, usedInComponent);

        if (active) {
          setResult({
            key: decryptedVal,
            error: null,
            loading: false,
            record: bestKeyRecord
          });
        }
      } catch (err: any) {
        if (active) {
          setResult({
            key: null,
            error: err.message || String(err),
            loading: false,
            record: null
          });
        }
      }
    }

    fetchAndSetup();

    return () => {
      active = false;
    };
  }, [platformName, keyType, usedInPage, usedInComponent]);

  return result;
}
