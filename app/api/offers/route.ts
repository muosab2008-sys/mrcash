import { NextResponse } from "next/server";

// 1. دالة جلب عروض شركة Notik مدمج بها مفاتيحك الرسمية
async function fetchNotik() {
  try {
    const res = await fetch(
      "https://notik.me/api/v2/get-offers?api_key=NofGnODVnHB3werypR5PRKx5ew8fTbB4&pub_id=Yog41D&app_id=psPQDvAS3y",
      { cache: "no-store" } // لضمان جلب عروض متجددة دائماً وعدم التخزين المؤقت القديم
    );
    
    if (!res.ok) return [];
    const json = await res.json();
    
    return (json.offers || []).map((item: any) => ({
      id: `notik-${item.id}`,
      name: item.title,
      description: item.description,
      provider: "Notik",
      payout: parseFloat(item.payout),
      mcPoints: Math.round(parseFloat(item.payout) * 1000), // تحويل الدولار إلى نقاط MC
      image: item.image_url,
      url: `${item.click_url}&user_id=[USER_ID]`,
    }));
  } catch (e) {
    console.error("Error fetching Notik:", e);
    return [];
  }
}

// 2. 🔥 الدالة الرئيسية المصدّرة التي يستدعيها الفرونت إند (يجب أن تكون GET بحروف كبيرة)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    // إذا طلب الفرونت إند شركة Notik محددة
    if (provider === "notik") {
      const notikOffers = await fetchNotik();
      return NextResponse.json({ status: "success", data: notikOffers });
    }

    // إذا لم يحدد أو طلب "all" نجمع ونعرض المتاح (وهنا Notik حالياً وجاهز لإضافة البقية بسطر واحد)
    const results = await Promise.allSettled([
      fetchNotik(),
      // مستقبلاً تضيف الشركات الثانية هنا مثل: fetchPubscale(), fetchClickwall()
    ]);

    const allOffers = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    // ترتيب العروض تلقائياً من الأعلى نقاطاً للأقل
    allOffers.sort((a, b) => b.mcPoints - a.mcPoints);

    return NextResponse.json({
      status: "success",
      total: allOffers.length,
      data: allOffers,
    });
  } catch (error) {
    console.error("Server API Error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
