import { NextResponse } from 'next/server';

export async function GET() {
  // المفاتيح مفصولة بدقة من النص اللي أرسلته يا مصعب
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1";
  const SECRET = "c880611e471a9f5a46c26c383a1269";
  const APP_ID = "1069";

  try {
    // الرابط الرسمي لـ Offery يطلب ترتيب معين (apikey ثم app_id ثم secret)
    const url = `https://offery.io/api/?apikey=${API_KEY}&app_id=${APP_ID}&secret=${SECRET}`;
    
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Network Error" }, { status: 500 });
  }
}
