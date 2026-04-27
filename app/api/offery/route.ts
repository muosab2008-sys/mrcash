import { NextResponse } from 'next/server';

export async function GET() {
  // المفتاح الخاص بك من لوحة تحكم Offery
  const API_KEY = "uccnjpr7cd6llvbomgr04no1hofoobb1";

  try {
    const url = `https://offery.io/api/?apikey=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    const result = await response.json();
    
    // التعديل هنا: نرسل result داخل كائن يحتوي على status و data
    // لكي يتوافق مع سطر (result.status === "success" && Array.isArray(result.data)) في صفحتك
    return NextResponse.json({
      status: "success",
      data: result 
    });

  } catch (error) {
    console.error("Offery Error:", error);
    return NextResponse.json({ status: "error", message: "Fetch failed" }, { status: 500 });
  }
}
