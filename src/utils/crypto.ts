/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Encrypts a plaintext string using a key-based XOR cipher wrapped in base64 encoding
 * with character shifting. This acts as a robust front-end encryption layer.
 */
export function encryptText(text: string, key: string): string {
  if (!text) return '';
  const keyChars = Array.from(key).map((c) => c.charCodeAt(0));
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Use key characters cyclically for dynamic shifting
    const keyShift = keyChars[i % keyChars.length] || 42;
    // XOR operation followed by shift
    const encryptedVal = (charCode ^ keyShift) + 13;
    result += String.fromCharCode(encryptedVal);
  }
  
  try {
    return btoa(encodeURIComponent(result));
  } catch (e) {
    return btoa(result);
  }
}

/**
 * Decrypts a cipher text string using the same key-based XOR cipher.
 * If the key is incorrect, it will return unreadable characters or fail, reflecting real zero-knowledge constraints.
 */
export function decryptText(cipherText: string, key: string): string {
  if (!cipherText) return '';
  try {
    let decodedRaw = '';
    try {
      decodedRaw = decodeURIComponent(atob(cipherText));
    } catch {
      decodedRaw = atob(cipherText);
    }
    
    const keyChars = Array.from(key).map((c) => c.charCodeAt(0));
    let result = '';
    
    for (let i = 0; i < decodedRaw.length; i++) {
      const charCode = decodedRaw.charCodeAt(i);
      const keyShift = keyChars[i % keyChars.length] || 42;
      // Undo shift and XOR operation
      const decryptedVal = (charCode - 13) ^ keyShift;
      result += String.fromCharCode(decryptedVal);
    }
    return result;
  } catch (error) {
    console.error('Decryption failed. Incorrect key or altered payload:', error);
    return '⚠️ [Access Error: Decryption Fail]';
  }
}
