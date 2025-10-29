import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase on the client side only
function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null; // Return null for server-side
  }
  
  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

function getFirebaseInstances() {
  const app = initializeFirebase();
  if (!app) {
    throw new Error('Firebase can only be initialized on client side');
  }
  
  // Conditionally initialize Auth with IndexedDB persistence for native platforms
const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    })
  : getAuth(app);
  
  const db: Firestore = getFirestore(app);
  
  return { app, auth, db };
}

export { getFirebaseInstances };