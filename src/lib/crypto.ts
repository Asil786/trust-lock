import argon2 from 'argon2';
import CryptoJS from 'crypto-js';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export interface VaultEntry {
  id?: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

// Generate cryptographically secure random salt
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Generate random IV for AES encryption
export function generateIV(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

// Derive key from master password using Argon2 (simulated with PBKDF2 for browser compatibility)
export async function deriveKeyFromPassword(password: string, salt: string): Promise<string> {
  // In a real implementation, you'd use Argon2. For browser compatibility, using PBKDF2
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000
  });
  return key.toString();
}

// Hash password with Argon2 for server storage (simulated with PBKDF2)
export async function hashPassword(password: string, salt: string): Promise<string> {
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations: 100000
  });
  return hash.toString();
}

// Encrypt vault entry with AES-256-GCM (using AES-256-CBC as GCM not available in crypto-js)
export function encryptVaultEntry(entry: VaultEntry, key: string): EncryptedData {
  const iv = generateIV();
  const entryJson = JSON.stringify(entry);
  
  const encrypted = CryptoJS.AES.encrypt(entryJson, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    ciphertext: encrypted.toString(),
    iv,
    salt: '' // Salt is managed separately for the master key
  };
}

// Decrypt vault entry
export function decryptVaultEntry(encryptedData: EncryptedData, key: string): VaultEntry {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData.ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    throw new Error('Failed to decrypt vault entry. Invalid key or corrupted data.');
  }
}

// Generate secure vault key
export function generateVaultKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Encrypt vault key with master key
export function encryptVaultKey(vaultKey: string, masterKey: string): EncryptedData {
  const iv = generateIV();
  
  const encrypted = CryptoJS.AES.encrypt(vaultKey, masterKey, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    ciphertext: encrypted.toString(),
    iv,
    salt: ''
  };
}

// Decrypt vault key with master key
export function decryptVaultKey(encryptedVaultKey: EncryptedData, masterKey: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedVaultKey.ciphertext, masterKey, {
      iv: CryptoJS.enc.Hex.parse(encryptedVaultKey.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Failed to decrypt vault key. Invalid master password.');
  }
}

// Generate strong password
export function generatePassword(length: number = 16, options: {
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
} = {}): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true
  } = options;

  let charset = '';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) throw new Error('At least one character type must be selected');

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}