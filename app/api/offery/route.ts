import { NextResponse } from 'next/server';

export async function GET() {
  // المفاتيح مأخوذة بدقة من لقطة الشاشة الخاصة بك (Offery Dashboard)
  // تأكد أن الـ API_KEY ينتهي بـ b1
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1"; 
  const SECRET = "c880611e471a9f5a46c26c383a1269";
  const APP_ID = "1069";

  try {
    // هذا الرابط المباشر والبسيط حسب الدليل (Documentation)
    const url = `https://offery.io/api/?apikey=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store'
    });

    const data = await response.json();

    // إذا لم ينجح الرابط البسيط، نجرب الرابط الكامل بالـ Secret والـ ID
    if (data.status === "error") {
      const fullUrl = `https://offery.io/api/?apikey=${API_KEY}&app_id=${APP_ID}&secret=${SECRET}`;
      const res2 = await fetch(fullUrl, { cache: 'no-store' });
      const data2 = await res2.json();
      return NextResponse.json(data2);
    }

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ status: "error", message: "Connection Error" }, { status: 500 });
  }
}
