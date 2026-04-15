import { NextResponse } from 'next/server';

export async function GET() {
  // المفاتيح مأخوذة مباشرة من الصورة التي أرسلتها لضمان الدقة 100%
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1"; // تأكدت إنه 32 حرف
  const SECRET = "c880611e471a9f5a46c26c383a1269"; 
  const APP_ID = "1069";

  try {
    // الرابط بالصيغة التي تقبلها Offery عادةً
    const url = `https://offery.io/api/?apikey=${API_KEY}&secret=${SECRET}&app_id=${APP_ID}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Connection Failed" }, { status: 500 });
  }
}
