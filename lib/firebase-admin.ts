import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

if (getApps().length === 0) {
  // 1. محاولة القراءة من المفتاح المجمع أولاً إذا كان موجوداً
  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  // 2. إذا لم يكن موجوداً، قم ببناء الكائن تلقائياً من المتغيرات الثلاثة المنفصلة التي أضفناها في Vercel
  if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // معالجة الأسطر الجديدة للمفتاح السري لضمان قراءته بشكل سليم
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  // 3. التخطي الذكي والدفاعي أثناء عملية الـ Build إذا لم تكن المتغيرات محقونة في تلك اللحظة
  if (!serviceAccount) {
    console.warn("⚠️ [FIREBASE_WARN] No service account credentials found. Standard build fallback applied.");
    adminApp = initializeApp({
      projectId: "mrcash-com",
    });
  } else {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: "mrcash-com",
    });
    console.log("✅ [FIREBASE_SUCCESS] Admin SDK initialized successfully via credentials.");
  }
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
