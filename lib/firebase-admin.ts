import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

// Initialize Firebase Admin
if (getApps().length === 0) {
  
  // دمج المتغيرات الأربعة الموجودة في لوحة تحكم Vercel لديك
  const serviceAccount = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // هنا نقوم بمعالجة مشكلة السطور الجديدة في المفتاح الخاص لـ Vercel
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
    : undefined;

  adminApp = initializeApp({
    // إذا لم تكن المتغيرات موجودة سيعتمد على الـ Default Credentials
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    projectId: process.env.FIREBASE_PROJECT_ID || "mrcash-com",
  });
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
