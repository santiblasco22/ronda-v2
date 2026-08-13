import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
// @ts-expect-error Firebase web auth types omit RN-only getReactNativePersistence.
import { type Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';
import { type FirebaseStorage, getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

/**
 * Configuración de Firebase leída desde variables de entorno públicas
 * (ver .env.example). El SDK web de Firebase detecta automáticamente que
 * corre en React Native y persiste la sesión con AsyncStorage.
 */
export const isFirebaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
);

if (!isFirebaseConfigured && !Constants.expoConfig?.extra?.silenceFirebaseWarning) {
  console.warn(
    '[Ronda] Falta configurar Firebase. Copiá .env.example a .env y completá las variables ' +
      'EXPO_PUBLIC_FIREBASE_* con los datos de tu proyecto. La app va a arrancar pero el ' +
      'login y los datos no van a funcionar hasta que la configures.'
  );
}

// Cuando falta la configuración usamos valores "dummy" con el formato
// correcto para que el SDK no explote al inicializarse (getAuth valida el
// formato del apiKey de forma síncrona). Cualquier llamada real a Firebase
// va a fallar igual, pero de forma controlada en el momento de uso.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaDummyDummyDummyDummyDummyDummyD',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ronda-dummy.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ronda-dummy',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ronda-dummy.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const firebaseApp = app;

let resolvedAuth: Auth;
if (Platform.OS !== 'web') {
  try {
    resolvedAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    resolvedAuth = getAuth(app);
  }
} else {
  resolvedAuth = getAuth(app);
}

export const auth: Auth = resolvedAuth;
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
