// client/src/utils/syncManager.js
import { getOfflineRecords, deleteOfflineRecord } from './indexedDB';
import { api } from '../api';

let isSyncing = false;

export const syncOfflineData = async () => {
  if (isSyncing || !navigator.onLine) return;

  try {
    isSyncing = true;
    const records = await getOfflineRecords();

    if (!records || records.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[SyncManager] ${records.length} pending offline records sync ho rahe hain...`);

    for (const record of records) {
      try {
        if (typeof api === 'function') {
          await api(record.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record.payload),
          });
        } else if (api && typeof api.post === 'function') {
          await api.post(record.endpoint, record.payload);
        }

        // Successfully sent, remove from IndexedDB
        await deleteOfflineRecord(record.id);
        console.log(`[SyncManager] Record #${record.id} successfully synced.`);
      } catch (err) {
        console.error(`[SyncManager] Failed to sync record #${record.id}:`, err);
        // Agar backend error de, toh loop ruk jayega aur agli bar network aane par retry hoga
        break;
      }
    }
  } catch (error) {
    console.error('[SyncManager] Error reading offline records:', error);
  } finally {
    isSyncing = false;
  }
};