import { initializeApp, getApps, cert, ServiceAccount, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

// Cached instances
let _app: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;
let _adminStorage: Storage | null = null;

// Initialize Firebase Admin SDK - safe for both build and runtime
function getOrInitializeApp(): App {
  if (_app) {
    return _app;
  }
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return _app;
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables"
    );
  }
  
  const config: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };
  
  _app = initializeApp({
    credential: cert(config),
  });
  
  return _app;
}

// Lazy getter for Auth - only initializes when actually used
export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    getOrInitializeApp();
    _adminAuth = getAuth();
  }
  return _adminAuth;
}

// Lazy getter for Firestore - only initializes when actually used
export function getAdminDb(): Firestore {
  if (!_adminDb) {
    getOrInitializeApp();
    _adminDb = getFirestore();
  }
  return _adminDb;
}

// Lazy getter for Storage - only initializes when actually used
export function getAdminStorage(): Storage {
  if (!_adminStorage) {
    getOrInitializeApp();
    _adminStorage = getStorage();
  }
  return _adminStorage;
}

// Export proxy objects for backwards compatibility with existing imports
// These will only initialize Firebase when a property/method is accessed at runtime
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    const auth = getAdminAuth();
    const value = (auth as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  }
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    const db = getAdminDb();
    const value = (db as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});
