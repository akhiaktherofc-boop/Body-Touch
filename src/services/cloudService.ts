import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDoc,
  db
} from '../firebase';

// Helper to sanitize document identifiers (Firestore keys cannot have slash /)
const sanitizeId = (id: string) => id.replace(/[\/\s?#]/g, '_');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (operationType === OperationType.GET) {
    console.warn(`[CloudDB] Safe recovery: Non-blocking read sync error on path "${path}" handled gracefully.`);
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes keys with `undefined` values from an object, 
 * as Firestore does not accept `undefined` as a valid value.
 */
export function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanUndefined(obj[key]);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Bootstrap a collection if it sits completely blank in Firestore.
 */
export async function bootstrapCollectionIfEmpty(collectionName: string, defaultData: any[]) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && defaultData && defaultData.length > 0) {
      console.log(`[CloudDB] Bootstrapping collection "${collectionName}" with preset items...`);
      for (const item of defaultData) {
        const itemId = item.id || `boot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const docRef = doc(db, collectionName, sanitizeId(itemId));
        const cleanedItem = cleanUndefined({ ...item, id: itemId });
        await setDoc(docRef, cleanedItem);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

/**
 * Register real-time synchronization listener for any collection
 */
export function syncCloudCollection(collectionName: string, callback: (items: any[]) => void) {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const items: any[] = [];
    snapshot.forEach((doc) => {
      items.push({ ...doc.data() });
    });
    callback(items);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, collectionName);
  });
}

/**
 * Add or overwrite document inside collection
 */
export async function setCloudDocument(collectionName: string, docId: string, data: any) {
  const docPath = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, sanitizeId(docId));
    const cleanedData = cleanUndefined({ ...data, id: docId });
    await setDoc(docRef, cleanedData, { merge: true });
    console.log(`[CloudDB] Document "${docId}" set in "${collectionName}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete document from a collection
 */
export async function deleteCloudDocument(collectionName: string, docId: string) {
  const docPath = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, sanitizeId(docId));
    await deleteDoc(docRef);
    console.log(`[CloudDB] Document "${docId}" deleted from "${collectionName}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * User Cloud Record Persistence
 */
export interface CloudUser {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  userLevel: 'FREE' | 'REGULAR' | 'PREMIUM' | 'ELITE';
  walletBalance: number;
}

export async function getCloudUser(username: string): Promise<CloudUser | null> {
  const userPath = `users/${username}`;
  try {
    const docRef = doc(db, 'users', sanitizeId(username.toLowerCase()));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CloudUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
  return null;
}

export async function saveCloudUser(user: CloudUser) {
  const userPath = `users/${user.username}`;
  try {
    const docRef = doc(db, 'users', sanitizeId(user.username.toLowerCase()));
    const cleanedUser = cleanUndefined(user);
    await setDoc(docRef, cleanedUser, { merge: true });
    console.log(`[CloudDB] User statistics saved for "@${user.username}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function clearCollection(collectionName: string) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
    console.log(`[CloudDB] Cleared all documents inside "${collectionName}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionName);
  }
}
