import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

// Initialize Firebase Admin
if (getApps().length === 0) {
  // For development, use default credentials or service account
  // In production, set FIREBASE_SERVICE_ACCOUNT_KEY env variable with the JSON key
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  adminApp = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    projectId: "mrcash-com",
  });
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
