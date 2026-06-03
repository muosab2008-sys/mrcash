import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const handleForgotPassword = async (email: string) => {
  const auth = getAuth();

  // هذا السطر يجبر الإيميل على إرسال الرابط إلى ملف الـ route.ts الخاص بك مباشرة رغماً عن إعدادات اللوحة
  const actionCodeSettings = {
    url: "https://mrcash.app/auth/action", 
    handleCodeInApp: true,
  };

  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    alert("تم إرسال رابط إعادة تعيين كلمة السر بنجاح من noreply@mrcash.app!");
  } catch (error: any) {
    console.error("خطأ أثناء الإرسال:", error.message);
  }
};
