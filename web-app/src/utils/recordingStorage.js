// IndexedDB utility for storing recordings
const DB_NAME = 'MonttyZoomRecordings';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

let db = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveRecording = async (recording) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store blob separately and reference it
    const blobData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(recording.blob);
    });

    const recordingData = {
      ...recording,
      blob: blobData, // Store as ArrayBuffer
      blobUrl: null // Don't store blob URL
    };

    await store.put(recordingData);
    return true;
  } catch (error) {
    console.error('Error saving recording:', error);
    return false;
  }
};

export const loadRecordings = async () => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const recordings = request.result.map(rec => {
          // Recreate blob and blobUrl
          const blob = new Blob([rec.blob], { type: 'video/webm' });
          const blobUrl = URL.createObjectURL(blob);
          
          return {
            ...rec,
            blob: blob,
            blobUrl: blobUrl
          };
        });
        resolve(recordings);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading recordings:', error);
    return [];
  }
};

export const deleteRecording = async (id) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting recording:', error);
    return false;
  }
};

export const clearAllRecordings = async () => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.clear();
    return true;
  } catch (error) {
    console.error('Error clearing recordings:', error);
    return false;
  }
};

