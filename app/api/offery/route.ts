import { NextResponse } from 'next/server';

export async function GET() {
  // يفضل وضع هذا في env variable
  const API_KEY = process.env.OFFERY_API_KEY || "c9dow9gf6dwikkp48nnlxxynr24ng6";
  const url = `https://offery.io/api/?apikey=${API_KEY}`;

  try {
    const response = await fetch(url, { 
      next: { revalidate: 300 } // تحديث العروض كل 5 دقائق بدل كل ثانية لتقليل الضغط
    });
    
    if (!response.ok) throw new Error('Failed to fetch from Offery');

    const result = await response.json();

    // تنظيم البيانات لضمان عدم حدوث خطأ في الواجهة (Frontend)
    const offers = Array.isArray(result) ? result : (result.offers || []);

    return NextResponse.json({
      status: "success",
      count: offers.length,
      data: offers
    });

  } catch (error) {
    console.error("Offery API Error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Could not load offers",
      data: [] 
    }, { status: 500 });
  }
}
