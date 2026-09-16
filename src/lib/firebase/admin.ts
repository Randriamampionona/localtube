import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin singleton.
 *
 * Used by the Clerk webhook route and by server actions to write to Firestore
 * with full privileges. NEVER import this into a client component — the service
 * account credentials must not reach the browser.
 *
 * Initialization is LAZY: the app is created the first time a Firestore method
 * is actually called, not when this module is imported. That keeps `next build`
 * (which imports route modules to collect metadata) from needing real
 * credentials, and surfaces any config error at request time instead.
 *
 * The private key is stored with escaped newlines in the .env file, so we
 * convert the literal "\n" sequences back into real newlines here.
 */
function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _db: Firestore | null = null;
function db(): Firestore {
  if (!_db) _db = getFirestore(getAdminApp());
  return _db;
}

/**
 * Lazy proxy: `adminDb.collection(...)` / `adminDb.doc(...)` behave exactly like
 * a Firestore instance, but the underlying app is only built on first use.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const instance = db();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
