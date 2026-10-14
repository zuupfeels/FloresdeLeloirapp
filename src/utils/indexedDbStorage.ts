import { FormularioCustomModel } from '../types';

const DB_NAME = 'LegajosAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'formularios_pdf';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

export function openFormulariosDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      dbInitPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
}

export async function getAllPdfFormulariosFromDB(): Promise<FormularioCustomModel[]> {
  try {
    const db = await openFormulariosDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Error leyendo formularios desde IndexedDB:', err);
    return [];
  }
}

export async function savePdfFormularioToDB(form: FormularioCustomModel): Promise<void> {
  try {
    const db = await openFormulariosDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(form);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Error guardando formulario en IndexedDB:', err);
  }
}

export async function deletePdfFormularioFromDB(id: string): Promise<void> {
  try {
    const db = await openFormulariosDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Error eliminando formulario de IndexedDB:', err);
  }
}

export async function saveMultiplePdfFormulariosToDB(forms: FormularioCustomModel[]): Promise<void> {
  try {
    const db = await openFormulariosDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const form of forms) {
        store.put(form);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error guardando múltiples formularios en IndexedDB:', err);
  }
}
