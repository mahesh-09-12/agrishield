import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const cleanEnv = (val?: string): string => {
  if (!val) return "";
  return val.replace(/^["']|["']$/g, "").trim();
};

const rawApiKey = cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const rawProjectId = cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);

// A valid Google/Firebase API key starts with AIza, contains no colons, and is typically 39 chars
const isValidApiKey = (key: string): boolean => {
  return Boolean(
    key &&
      !key.includes(":") &&
      key.length >= 20 &&
      !key.toLowerCase().includes("dummy") &&
      !key.toLowerCase().includes("placeholder")
  );
};

export const isFirebaseConfigured = Boolean(
  isValidApiKey(rawApiKey) &&
    rawProjectId &&
    rawProjectId !== "agrishield-demo" &&
    !rawProjectId.toLowerCase().includes("placeholder")
);

// Fallback safe dummy key that satisfies Firebase SDK syntax checks (non-empty and no colons)
const safeApiKey = isValidApiKey(rawApiKey)
  ? rawApiKey
  : "AIzaSyAgriShieldDemoKeySafeForSDKInit0";

const firebaseConfig = {
  apiKey: safeApiKey,
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "agrishield-demo.firebaseapp.com",
  projectId: rawProjectId || "agrishield-demo",
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "agrishield-demo.appspot.com",
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "1234567890",
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID) || "1:1234567890:web:abcdef123456",
};

// Initialize single Firebase App, Auth, Firestore, and Storage instances
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance: Auth;
try {
  authInstance = getAuth(app);
} catch (err) {
  console.warn("Firebase Auth getAuth error, using fallback instance:", err);
  authInstance = {
    currentUser: null,
  } as unknown as Auth;
}
export const auth: Auth = authInstance;

let storageInstance: any;
try {
  storageInstance = getStorage(app);
} catch (err) {
  console.warn("Firebase Storage getStorage error:", err);
  storageInstance = {} as any;
}
export const storage = storageInstance;

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
