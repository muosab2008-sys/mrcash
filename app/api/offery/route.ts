import { NextResponse } from 'next/server';

export async function GET() {
  // جلب المفتاح الأساسي من Vercel
  const API_KEY = process.env.OFFERY_API_KEY;
  
  // المفاتيح الأخرى التي ظهرت في صورتك (يفضل إضافتها في Vercel لاحقاً أيضاً)
  const SECRET = "c880611e471a9f5a46c26c383a1269"; 
  const APP_ID = "1069";

  try {
    // الرابط الرسمي الكامل لشركة Offery
    const response = await fetch(`https://offery.io/api/?apikey=${API_KEY}&secret=${SECRET}&app_id=${APP_ID}`, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Connection Failed" }, { status: 500 });
  }
}
