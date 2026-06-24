// Client-side local storage-based Pseudo-Firebase database emulation
// This provides a fully offline, self-contained database matching the Firestore API

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
  localStorage.setItem(key, JSON.stringify(finalData));
  
  setTimeout(() => {
    triggerListeners(docRef.collectionName, docRef.docId);
  }, 10);
}

export async function addDoc(colRef: CollectionRef, data: any) {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const key = `bodytouch_db_${colRef.collectionName}_${docId}`;
  const finalData = { ...data, id: docId };
  localStorage.setItem(key, JSON.stringify(finalData));
  
  setTimeout(() => {
    triggerListeners(colRef.collectionName, docId);
  }, 10);
  
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
  localStorage.setItem(key, JSON.stringify(finalData));
  
  setTimeout(() => {
    triggerListeners(docRef.collectionName, docRef.docId);
  }, 10);
}

export async function deleteDoc(docRef: DocRef) {
  const key = `bodytouch_db_${docRef.collectionName}_${docRef.docId}`;
  localStorage.removeItem(key);
  
  setTimeout(() => {
    triggerListeners(docRef.collectionName, docRef.docId);
  }, 10);
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
