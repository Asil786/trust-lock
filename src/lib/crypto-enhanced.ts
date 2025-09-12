// Enhanced crypto functions with improved AES-GCM and PBKDF2 implementation
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  authTag?: string; // For GCM mode
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
export function generateSalt(length: number = 32): string {
  return crypto.getRandomValues(new Uint8Array(length))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}

// Generate random IV for AES encryption
export function generateIV(length: number = 16): string {
  return crypto.getRandomValues(new Uint8Array(length))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}

// Derive key from master password using PBKDF2 with Web Crypto API
export async function deriveKeyFromPassword(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = new Uint8Array(salt.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, // Increased iterations for better security
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Hash password with PBKDF2 for server storage
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = new Uint8Array(salt.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    []
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  return Array.from(new Uint8Array(exportedKey))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Encrypt vault entry with AES-256-GCM
export async function encryptVaultEntry(entry: VaultEntry, key: CryptoKey): Promise<EncryptedData> {
  const iv = generateIV();
  const ivBuffer = new Uint8Array(iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  const encoder = new TextEncoder();
  const entryJson = JSON.stringify(entry);
  const entryBuffer = encoder.encode(entryJson);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    entryBuffer
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = Array.from(encryptedArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    ciphertext,
    iv,
    salt: '' // Salt is managed separately for the master key
  };
}

// Decrypt vault entry
export async function decryptVaultEntry(encryptedData: EncryptedData, key: CryptoKey): Promise<VaultEntry> {
  try {
    const ivBuffer = new Uint8Array(encryptedData.iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const ciphertextBuffer = new Uint8Array(
      encryptedData.ciphertext.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (error) {
    throw new Error('Failed to decrypt vault entry. Invalid key or corrupted data.');
  }
}

// Generate secure vault key
export function generateVaultKey(): string {
  return generateSalt(64); // 256-bit key
}

// Encrypt vault key with master key
export async function encryptVaultKey(vaultKey: string, masterKey: CryptoKey): Promise<EncryptedData> {
  const iv = generateIV();
  const ivBuffer = new Uint8Array(iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  const encoder = new TextEncoder();
  const vaultKeyBuffer = encoder.encode(vaultKey);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    masterKey,
    vaultKeyBuffer
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = Array.from(encryptedArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    ciphertext,
    iv,
    salt: ''
  };
}

// Decrypt vault key with master key
export async function decryptVaultKey(encryptedVaultKey: EncryptedData, masterKey: CryptoKey): Promise<string> {
  try {
    const ivBuffer = new Uint8Array(encryptedVaultKey.iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const ciphertextBuffer = new Uint8Array(
      encryptedVaultKey.ciphertext.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      masterKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Failed to decrypt vault key. Invalid master password.');
  }
}

// Generate strong password with improved randomness
export function generatePassword(length: number = 16, options: {
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
} = {}): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = false
  } = options;

  let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowercase = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Exclude similar looking characters if requested
  if (excludeSimilar) {
    uppercase = uppercase.replace(/[O]/g, '');
    lowercase = lowercase.replace(/[ol]/g, '');
    numbers = numbers.replace(/[01]/g, '');
    symbols = symbols.replace(/[|]/g, '');
  }

  let charset = '';
  if (includeUppercase) charset += uppercase;
  if (includeLowercase) charset += lowercase;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  if (!charset) throw new Error('At least one character type must be selected');

  // Use crypto.getRandomValues for better randomness
  const randomArray = crypto.getRandomValues(new Uint32Array(length));
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[randomArray[i] % charset.length];
  }

  // Ensure at least one character from each selected type
  const requirements = [];
  if (includeUppercase) requirements.push({ chars: uppercase, used: false });
  if (includeLowercase) requirements.push({ chars: lowercase, used: false });
  if (includeNumbers) requirements.push({ chars: numbers, used: false });
  if (includeSymbols) requirements.push({ chars: symbols, used: false });

  // Check if requirements are met
  for (const char of password) {
    for (const req of requirements) {
      if (req.chars.includes(char)) {
        req.used = true;
      }
    }
  }

  // If any requirement is not met, regenerate (with a limit to prevent infinite loops)
  const unmetRequirements = requirements.filter(req => !req.used);
  if (unmetRequirements.length > 0 && length >= requirements.length) {
    // Replace random positions with required characters
    const passwordArray = password.split('');
    const randomPositions = crypto.getRandomValues(new Uint32Array(unmetRequirements.length));
    
    unmetRequirements.forEach((req, index) => {
      const pos = randomPositions[index] % length;
      const charIndex = crypto.getRandomValues(new Uint32Array(1))[0] % req.chars.length;
      passwordArray[pos] = req.chars[charIndex];
    });
    
    password = passwordArray.join('');
  }

  return password;
}

// Check password against HIBP using k-anonymity
export async function checkPasswordBreach(password: string): Promise<boolean> {
  try {
    // Hash the password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Use k-anonymity: send only first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    // Check if our suffix appears in the response
    return text.includes(suffix);
  } catch (error) {
    console.error('Error checking password breach:', error);
    return false; // Fail safely
  }
}

// Export/Import functions for vault backup
export async function exportVault(entries: VaultEntry[], masterKey: CryptoKey): Promise<string> {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    entries: []
  };

  for (const entry of entries) {
    const encrypted = await encryptVaultEntry(entry, masterKey);
    exportData.entries.push(encrypted);
  }

  return JSON.stringify(exportData, null, 2);
}

export async function importVault(exportedData: string, masterKey: CryptoKey): Promise<VaultEntry[]> {
  try {
    const data = JSON.parse(exportedData);
    const entries: VaultEntry[] = [];

    for (const encryptedEntry of data.entries) {
      const decrypted = await decryptVaultEntry(encryptedEntry, masterKey);
      entries.push(decrypted);
    }

    return entries;
  } catch (error) {
    throw new Error('Failed to import vault. Invalid file or password.');
  }
}