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
 * Firebase client configuration sourced strictly from Vite environment variables.
 * Never hard-code live API keys, project identifiers, or secrets in source files.
 */
const metaEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof globalThis !== 'undefined' && (globalThis as { process?: { env?: Record<string, string> } }).process?.env) || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSy_DEV_TEST_PLACEHOLDER',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'munchies-dev.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'munchies-dev',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'munchies-dev.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
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
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db: Firestore = dbInstance;

export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Connect to emulators if explicitly enabled
if (metaEnv.DEV && metaEnv.VITE_USE_FIREBASE_EMULATORS === 'true') {
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
