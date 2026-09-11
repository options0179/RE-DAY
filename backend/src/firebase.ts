import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function createFirebaseApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is required when using the emulator");
    }
    return initializeApp({ projectId });
  }

  if (process.env.K_SERVICE) {
    return initializeApp();
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

export function getDatabase() {
  createFirebaseApp();
  return getFirestore();
}

export function getFirebaseAuth() {
  createFirebaseApp();
  return getAuth();
}
