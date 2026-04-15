import { NextResponse } from 'next/server';

export async function GET() {
  // المفتاح الصحيح والكامل من صورتك السابقة (32 حرف)
  const MY_API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1";

  try {
    // هذا هو الرابط الرسمي حرفياً كما ورد في الدليل
    const url = `https://offery.io/api/?apikey=${MY_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // لضمان جلب عروض جديدة دائماً
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to connect to Offery" }, { status: 500 });
  }
}
