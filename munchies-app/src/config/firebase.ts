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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoFallbackKeyForDevelopment12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'munchies-aswan.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'munchies-aswan',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'munchies-aswan.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:a1b2c3d4e5f6g7h8',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
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
