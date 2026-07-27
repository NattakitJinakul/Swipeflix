/**
 * Firebase init. Reads process.env.EXPO_PUBLIC_FIREBASE_* (placeholders OK — no network at import).
 * Auth persistence via initializeAuth + getReactNativePersistence(AsyncStorage) so sessions survive
 * app restarts (docs/08 risk 7, docs/09).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// getReactNativePersistence ships only in Firebase's react-native build; it is absent from the
// default public type surface. Cast the namespace so this typechecks on any resolution while Metro
// resolves the RN entry (which provides it) at runtime.
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn(
    '[firebase] EXPO_PUBLIC_FIREBASE_API_KEY missing — auth/firestore will not work until .env is set.'
  );
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function makeAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence
        ? getReactNativePersistence(AsyncStorage)
        : undefined,
    });
  } catch {
    // Already initialized (e.g. Fast Refresh) — reuse the existing instance.
    return getAuth(app);
  }
}

export const auth: Auth = makeAuth();
export const db: Firestore = getFirestore(app);
