import { NextResponse } from 'next/server';

export async function GET() {
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1";
  const url = `https://offery.io/api/?apikey=${API_KEY}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();

    // هنا نتأكد أننا نرسل "success" و "data" مهما كان شكل رد الشركة
    return NextResponse.json({
      status: "success",
      data: Array.isArray(result) ? result : (result.offers || [])
    });

  } catch (error) {
    return NextResponse.json({ status: "error", data: [] });
  }
}
