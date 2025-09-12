import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VaultEntry } from '@/lib/crypto';

const DB_NAME = 'SecureVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_entries';

interface OfflineEntry extends VaultEntry {
  lastModified: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('lastModified', 'lastModified');
          store.createIndex('syncStatus', 'syncStatus');
        }
      };
    });
  };

  const saveOffline = async (entry: VaultEntry): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const offlineEntry: OfflineEntry = {
      ...entry,
      lastModified: Date.now(),
      syncStatus: 'pending'
    };
    
    await store.put(offlineEntry);
  };

  const getOfflineEntries = async (): Promise<OfflineEntry[]> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const syncWithSupabase = async (userId: string): Promise<void> => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    
    try {
      const offlineEntries = await getOfflineEntries();
      const pendingEntries = offlineEntries.filter(entry => entry.syncStatus === 'pending');
      
      // Sync pending entries to Supabase
      for (const entry of pendingEntries) {
        try {
          const { error } = await supabase
            .from('vault_entries')
            .upsert({
              id: entry.id,
              user_id: userId,
              encrypted_data: JSON.stringify(entry),
              iv: entry.id, // Using id as IV for demo
              metadata: {}
            });
          
          if (!error) {
            // Mark as synced in IndexedDB
            const db = await openDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            entry.syncStatus = 'synced';
            await store.put(entry);
          }
        } catch (error) {
          console.error('Sync error for entry:', entry.id, error);
        }
      }
      
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  return {
    isOnline,
    syncStatus,
    saveOffline,
    getOfflineEntries,
    syncWithSupabase
  };
}