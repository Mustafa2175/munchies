/**
 * @module config/firebase
 * @description Firebase initialization with resilient fallbacks for development.
 */

import { initializeApp, type FirebaseApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';

/**
 * Firebase configuration sourced from Vite environment variables.
 * Provides fallback dummy strings so the app works seamlessly in local/offline demo mode.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDwMPEoN2HXR7bwsadLsAuJ2yl5iIMPuVE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'munchies-9a7b7.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'munchies-9a7b7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'munchies-9a7b7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '365206142749',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:365206142749:web:55d21fa70c0e027601abf4',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1NDXR9HJXR',
};

let appInstance: FirebaseApp;
try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.warn('Firebase initialization note (using local demo mode):', error);
  appInstance = initializeApp(firebaseConfig, 'munchies-app');
}

export const app: FirebaseApp = appInstance;
export const auth: Auth = getAuth(app);

let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db: Firestore = dbInstance;

export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Connect to emulators if explicitly enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch {
    // Emulator connection already established
  }
}

export default app;
