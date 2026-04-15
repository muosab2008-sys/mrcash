import { NextResponse } from 'next/server';

export async function GET() {
  // المفاتيح مأخوذة من نصك الأخير بدقة
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1";
  const SECRET = "c880611e471a9f5a46c26c383a1269";
  const APP_ID = "1069";

  try {
    // جربنا GET وما ضبط، الآن بنجرب نرسلها كـ Query Parameters بترتيب مختلف
    // ونضيف الـ Secret في النهاية كما تطلب بعض إصدارات Offery
    const url = `https://offery.io/api/?apikey=${API_KEY}&app_id=${APP_ID}&secret=${SECRET}`;
    
    console.log("Testing URL:", url); // هذا بيطلع لك في لوحة تحكم Vercel

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0' // بعض الشركات تحجب الطلبات البرمجية بدون User-Agent
      },
      cache: 'no-store'
    });
    
    const text = await response.text(); // بنقرأ الرد كنص أولاً عشان نشوف لو فيه خطأ
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ status: "error", message: "Response was not JSON", raw: text });
    }

  } catch (error) {
    return NextResponse.json({ status: "error", message: "Fetch failed" }, { status: 500 });
  }
}
