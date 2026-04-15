import { NextResponse } from 'next/server';

export async function GET() {
  // المفاتيح من الصورة التي أرسلتها (يفضل وضعها في Vercel للأمان)
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1"; // الـ API Key من الصورة
  const SECRET = "c880611e471a9f5a46c26c383a1269";   // الـ Secret Key من الصورة
  const APP_ID = "1069";                            // رقم الـ App ID

  try {
    // الرابط الصحيح لطلب العروض من Offery مع كل المعايير
    const response = await fetch(`https://offery.io/api/?apikey=${API_KEY}&secret=${SECRET}&app_id=${APP_ID}`, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Connection Failed" }, { status: 500 });
  }
}
