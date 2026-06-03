import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

if (getApps().length === 0) {
  // هنا نقوم بقراءة المتغيرات الأربعة التي أضفتها في فيرسيل بشكل مباشر وآمن
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || "mrcash-com";
  // هذا السطر السحري يقوم بإصلاح مشكلة الأسطر وعلامات الـ \n في المفتاح تلقائياً
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // إذا كانت البيانات موجودة نقوم بالتشغيل عبر الـ cert
  const hasCredentials = clientEmail && privateKey;

  adminApp = initializeApp({
    credential: hasCredentials 
      ? cert({ projectId, clientEmail, privateKey }) 
      : undefined,
    projectId: projectId,
  });
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
