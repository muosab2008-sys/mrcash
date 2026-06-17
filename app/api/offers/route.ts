import { NextRequest, NextResponse } from 'next/server';

// دالة موحدة لتحويل الأرباح بالدولار إلى نقاط موقعك (معدل: $1 = 1000 نقطة)
const usdToMCPoints = (usd: number): number => Math.round(usd * 1000);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider'); // لقط اسم الشركة المطلوبة من الرابط

  try {
    // --------------------------------------------------------
    // 1. شركة Notik (تقرأ المفتاح السري بأمان من استضافة Vercel)
    // --------------------------------------------------------
    if (provider === 'notik') {
      const API_KEY = process.env.NOTIK_API_KEY;
      const PUB_ID = "Yog41D";
      const APP_ID = "psPQDvAS3y";

      // التحقق من وجود المفتاح في الاستضافة لمنع الأخطاء
      if (!API_KEY) {
        return NextResponse.json({ status: "error", message: "Notik API Key is missing in Vercel settings" }, { status: 500 });
      }
      
      const response = await fetch(`https://notik.me/api/v1/live-campaigns-for-user?api_key=${API_KEY}&pub_id=${PUB_ID}&app_id=${APP_ID}&user_id=demo-user-1`, { 
        next: { revalidate: 300 } // كاش لمدة 5 دقائق لسرعة خارقة وتقليل الضغط
      });
      
      if (!response.ok) throw new Error('Failed to fetch from Notik');

      const result = await response.json();
      const rawOffers = result.data || [];

      // غسيل وتنظيف داتا Notik لتطابق الهيكل الموحد لموقعك بالملي
      const cleanOffers = rawOffers.map((item: any) => ({
        id: `notik_${item.offer_id}`,
        name: item.name || "Trending Offer",
        description: item.description1 || "Complete this trending offer to earn MC instantly!",
        provider: "Notik",
        payout: parseFloat(item.payout || 0),
        mcPoints: usdToMCPoints(parseFloat(item.payout || 0)),
        image: item.image_url || "/placeholder.svg",
        url: item.click_url || "#"
      }));

      return NextResponse.json({ status: "success", count: cleanOffers.length, data: cleanOffers });
    }

    // --------------------------------------------------------
    // 💡 مستقبلاً: هنا تضيف الشركات الجديدة اللي تبي تربطها بنفس الطريقة تماماً 👇
    // --------------------------------------------------------
    // if (provider === 'clickwall') {
    //   // كود جلب وتنظيف عروض شركة ClickWall بنفس الهيكل الموحد
    // }

    // لو المستخدم طلب شركة مو موجودة أو ممسوحة
    return NextResponse.json({ status: "error", message: "Provider not found or disabled", data: [] }, { status: 400 });

  } catch (error: any) {
    console.error(`[API Offers Error for ${provider}]:`, error.message);
    return NextResponse.json({ status: "error", message: "Could not load offers", data: [] }, { status: 500 });
  }
}
