import { getApps, getApp, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Browser Firebase app. Only the NEXT_PUBLIC_* config is exposed here — safe to
 * ship to the client. Writes from the browser are governed by Firestore security
 * rules; in this project most writes go through server actions (see src/server),
 * so this client is mainly for real-time reads if you add them later.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
