// Client-side local storage-based Pseudo-Firebase database emulation
// This provides a fully offline, self-contained database matching the Firestore API
import { io } from 'socket.io-client';

export const db = {
  type: 'local_db'
};

export const auth = {
  currentUser: null
};

// Helper to sanitize document identifiers (illegal characters stripped)
const sanitizeKey = (id: string) => id.replace(/[\/\s?#]/g, '_');

export class DocRef {
  db: any;
  collectionName: string;
  docId: string;
  constructor(db: any, collectionName: string, docId: string) {
    this.db = db;
    this.collectionName = collectionName;
    this.docId = sanitizeKey(docId);
  }
}

export class CollectionRef {
  db: any;
  collectionName: string;
  constructor(db: any, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }
}

export class QueryRef {
  collectionRef: CollectionRef;
  constraints: any[];
  constructor(collectionRef: CollectionRef, constraints: any[]) {
    this.collectionRef = collectionRef;
    this.constraints = constraints;
  }
}

export function doc(db: any, collectionName: string, docId?: string): DocRef {
  if (!docId) {
    throw new Error("doc requires docId");
  }
  return new DocRef(db, collectionName, docId);
}

export function collection(db: any, collectionName: string): CollectionRef {
  return new CollectionRef(db, collectionName);
}

export function query(collectionRef: CollectionRef, ...constraints: any[]): QueryRef {
  return new QueryRef(collectionRef, constraints);
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function limit(num: number) {
  return { type: 'limit', num };
}

// In-memory subscription listeners for real-time reactivity
interface Listener {
  id: string;
  path: string; // collectionName or collectionName/docId
  callback: (snapshot: any) => void;
  isCollection: boolean;
}

const listeners: Listener[] = [];

function triggerListeners(collectionName: string, docId?: string) {
  for (const listener of listeners) {
    if (listener.isCollection && listener.path === collectionName) {
      getDocs(new CollectionRef(db, collectionName)).then(snapshot => {
        listener.callback(snapshot);
      }).catch(err => console.error("Error executing collection snapshot: ", err));
    } else if (!listener.isCollection && docId && listener.path === `${collectionName}/${docId}`) {
      getDoc(new DocRef(db, collectionName, docId)).then(snapshot => {
        listener.callback(snapshot);
      }).catch(err => console.error("Error executing document snapshot: ", err));
    }
  }
}

// Establish Socket.io connection for real-time client-to-client updates on Hostinger
let socket: any = null;
if (typeof window !== 'undefined') {
  try {
    socket = io(window.location.origin, {
      transports: ["websocket", "polling"]
    });
    
    socket.on("db_changed", (event: { collectionName: string, docId?: string, data?: any, type: 'set' | 'delete' | 'clear' }) => {
      const { collectionName, docId, data, type } = event;
      if (type === 'set' && docId) {
        const key = `bodytouch_db_${collectionName}_${docId}`;
        localStorage.setItem(key, JSON.stringify(data));
        triggerListeners(collectionName, docId);
      } else if (type === 'delete' && docId) {
        const key = `bodytouch_db_${collectionName}_${docId}`;
        localStorage.removeItem(key);
        triggerListeners(collectionName, docId);
      } else if (type === 'clear') {
        const prefix = `bodytouch_db_${collectionName}_`;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        triggerListeners(collectionName);
      }
    });
  } catch (err) {
    console.warn("Failed to initialize Socket.io client for database sync:", err);
  }
}

// Perform initial sync with server database on startup
async function initialSync() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch("/api/db/get_all");
    if (res.ok) {
      const serverDb = await res.json();
      Object.keys(serverDb).forEach(collectionName => {
        const collectionData = serverDb[collectionName];
        const prefix = `bodytouch_db_${collectionName}_`;
        
        // Remove existing local storage keys for this collection to ensure accurate state alignment
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Insert fresh server documents
        Object.keys(collectionData).forEach(docId => {
          const key = `${prefix}${docId}`;
          localStorage.setItem(key, JSON.stringify(collectionData[docId]));
        });
      });
      
      // Trigger all listeners to refresh current active pages
      listeners.forEach(listener => {
        if (listener.isCollection) {
          triggerListeners(listener.path);
        } else {
          const parts = listener.path.split('/');
          if (parts.length === 2) {
            triggerListeners(parts[0], parts[1]);
          }
        }
      });
    }
  } catch (err) {
    console.warn("Initial DB sync failed (normal if server is starting/offline):", err);
  }
}

// Run the initial sync
initialSync();

export async function getDoc(docRef: DocRef) {
  const key = `bodytouch_db_${docRef.collectionName}_${docRef.docId}`;
  const dataStr = localStorage.getItem(key);
  const exists = dataStr !== null;
  return {
    exists: () => exists,
    id: docRef.docId,
    ref: docRef,
    data: () => exists ? JSON.parse(dataStr!) : undefined
  };
}

export const getDocFromServer = getDoc;

export async function setDoc(docRef: DocRef, data: any, options?: { merge?: boolean }) {
  const key = `bodytouch_db_${docRef.collectionName}_${docRef.docId}`;
  let finalData = { ...data };
  if (options?.merge) {
    const existingStr = localStorage.getItem(key);
    if (existingStr) {
      finalData = { ...JSON.parse(existingStr), ...data };
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(finalData));
  } catch (e) {
    console.error(`[Firebase Emulation] Failed to setDoc for ${key} due to storage quota:`, e);
  }
  
  triggerListeners(docRef.collectionName, docRef.docId);

  // Sync to server database in background
  try {
    fetch("/api/db/set_doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionName: docRef.collectionName,
        docId: docRef.docId,
        data: finalData,
        merge: options?.merge
      })
    }).catch(err => console.warn("Failed background set_doc sync:", err));
  } catch (err) {
    // Non-blocking
  }
}

export async function addDoc(colRef: CollectionRef, data: any) {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const key = `bodytouch_db_${colRef.collectionName}_${docId}`;
  const finalData = { ...data, id: docId };
  try {
    localStorage.setItem(key, JSON.stringify(finalData));
  } catch (e) {
    console.error(`[Firebase Emulation] Failed to addDoc for ${key} due to storage quota:`, e);
  }
  
  triggerListeners(colRef.collectionName, docId);
  
  // Sync to server database in background
  try {
    fetch("/api/db/set_doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionName: colRef.collectionName,
        docId: docId,
        data: finalData
      })
    }).catch(err => console.warn("Failed background addDoc sync:", err));
  } catch (err) {
    // Non-blocking
  }
  
  return {
    id: docId,
    path: `${colRef.collectionName}/${docId}`
  };
}

export async function updateDoc(docRef: DocRef, data: any) {
  const key = `bodytouch_db_${docRef.collectionName}_${docRef.docId}`;
  const existingStr = localStorage.getItem(key);
  let finalData = { ...data };
  if (existingStr) {
    finalData = { ...JSON.parse(existingStr), ...data };
  }
  try {
    localStorage.setItem(key, JSON.stringify(finalData));
  } catch (e) {
    console.error(`[Firebase Emulation] Failed to updateDoc for ${key} due to storage quota:`, e);
  }
  
  triggerListeners(docRef.collectionName, docRef.docId);

  // Sync to server database in background
  try {
    fetch("/api/db/set_doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionName: docRef.collectionName,
        docId: docRef.docId,
        data: finalData,
        merge: true
      })
    }).catch(err => console.warn("Failed background updateDoc sync:", err));
  } catch (err) {
    // Non-blocking
  }
}

export async function deleteDoc(docRef: DocRef) {
  const key = `bodytouch_db_${docRef.collectionName}_${docRef.docId}`;
  localStorage.removeItem(key);
  
  triggerListeners(docRef.collectionName, docRef.docId);

  // Sync to server database in background
  try {
    fetch("/api/db/delete_doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionName: docRef.collectionName,
        docId: docRef.docId
      })
    }).catch(err => console.warn("Failed background deleteDoc sync:", err));
  } catch (err) {
    // Non-blocking
  }
}

export async function getDocs(queryOrRef: CollectionRef | QueryRef) {
  const isQuery = queryOrRef instanceof QueryRef;
  const colRef = isQuery ? (queryOrRef as QueryRef).collectionRef : (queryOrRef as CollectionRef);
  const prefix = `bodytouch_db_${colRef.collectionName}_`;
  
  const docs: any[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const docId = key.substring(prefix.length);
      const dataStr = localStorage.getItem(key);
      if (dataStr) {
        docs.push({
          id: docId,
          data: () => JSON.parse(dataStr!)
        });
      }
    }
  }
  
  let finalDocs = docs;
  if (isQuery) {
    const q = queryOrRef as QueryRef;
    for (const c of q.constraints) {
      if (c && c.type === 'where') {
        finalDocs = finalDocs.filter(d => {
          const val = d.data()[c.field];
          if (c.op === '==') return val === c.value;
          if (c.op === '!=') return val !== c.value;
          return true;
        });
      }
    }
    const limitConstraint = q.constraints.find(c => c && c.type === 'limit');
    if (limitConstraint) {
      finalDocs = finalDocs.slice(0, limitConstraint.num);
    }
  }
  
  return {
    empty: finalDocs.length === 0,
    size: finalDocs.length,
    docs: finalDocs,
    forEach: (cb: (doc: any) => void) => {
      finalDocs.forEach(cb);
    }
  };
}

export function onSnapshot(
  ref: DocRef | CollectionRef,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
) {
  const isCollection = ref instanceof CollectionRef;
  const path = isCollection 
    ? (ref as CollectionRef).collectionName 
    : `${(ref as DocRef).collectionName}/${(ref as DocRef).docId}`;
    
  const listenerId = `${Date.now()}-${Math.random()}`;
  
  listeners.push({
    id: listenerId,
    path,
    callback: onNext,
    isCollection
  });
  
  if (isCollection) {
    getDocs(ref as CollectionRef).then(onNext).catch(onError);
  } else {
    getDoc(ref as DocRef).then(onNext).catch(onError);
  }
  
  return () => {
    const idx = listeners.findIndex(l => l.id === listenerId);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  };
}
