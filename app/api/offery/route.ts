import { NextResponse } from 'next/server';

// دالة تحويل الـ USD إلى نقاط MC (معدل: $1 = 1000 نقطة)
const usdToMCPoints = (usd: number): number => Math.round(usd * 1000);

export async function GET() {
  const API_KEY = process.env.OFFERY_API_KEY || "c9dow9gf6dwikkp48nnlxxynr24ng6";
  const url = `https://offery.io/api/?apikey=${API_KEY}`;

  try {
    const response = await fetch(url, { 
      next: { revalidate: 300 } // كاش لمدة 5 دقائق لسرعة خارقة وتقليل الضغط
    });
    
    if (!response.ok) throw new Error('Failed to fetch from Offery');

    const result = await response.json();

    // 1. التأكد من لقط المصفوفة بشكل صحيح حسب توثيق Offery
    const rawOffers = Array.isArray(result) ? result : (result.offers || result.data || []);

    // 2. 🛡️ غسيل البيانات وعمل Mapping موحد ليطابق الفرونت إند تماماً
    const cleanOffers = rawOffers.map((item: any) => {
      // تحويل الـ payout إلى رقم عشري بشكل آمن مهما كانت صيغته من الشركة
      const payoutUSD = parseFloat(item.payout || item.reward || 0);
      
      return {
        id: String(item.id || item.offer_id || Math.random()),
        name: item.name || item.title || "Special Offer",
        description: item.description || item.instructions || "Complete this task to earn MC instantly!",
        provider: "Offery",
        payout: payoutUSD,
        mcPoints: usdToMCPoints(payoutUSD), // حساب النقاط فوراً في السيرفر لأمان أعلى
        image: item.image || item.image_url || "/placeholder.svg",
        url: item.url || item.click_url || "#"
      };
    });

    // 3. إرسال البيانات نظيفة وجاهزة للفرونت إند
    return NextResponse.json({
      status: "success",
      count: cleanOffers.length,
      data: cleanOffers // الحين الفرونت إند بيقراها في ثانية ويملا الشاشة عروض!
    });

  } catch (error: any) {
    console.error("Offery API Critical Error:", error.message);
    return NextResponse.json({ 
      status: "error", 
      message: "Could not load offers",
      data: [] 
    }, { status: 500 });
  }
}
