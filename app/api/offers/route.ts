import { NextResponse } from "next/server";

// 1. دالة جلب العروض مع تمرير الـ userId الممرر ديناميكياً
async function fetchNotik(userId: string) {
  try {
    // الرابط الرسمي الجديد بناءً على التوثيق مع تمرير الـ user_id الإجباري
    const url = `https://notik.me/api/v1/live-campaigns-for-user?api_key=NofGnODVnHB3werypR5PRKx5ew8fTbB4&pub_id=Yog41D&app_id=psPQDvAS3y&user_id=${userId}&duration=30d&page=1`;
    
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    
    const json = await res.json();
    
    // بناءً على التوثيق، العروض تكون داخل json.data مباشرة
    const campaigns = json.data || [];
    
    return campaigns.map((item: any) => ({
      id: `notik-${item.offer_id}`,
      name: item.name,
      description: item.description1 || item.description2 || "Complete this offer to earn MC",
      provider: "Notik",
      payout: parseFloat(item.payout),
      mcPoints: Math.round(parseFloat(item.payout) * 1000), // تحويل الـ Payout لنقاط موقعك
      image: item.image_url,
      url: item.click_url, // الرابط جاهز للاستخدام الفوري ولا يحتاج تعديل
    }));
  } catch (e) {
    console.error("Error fetching Notik campaigns:", e);
    return [];
  }
}

// 2. الدالة الرئيسية المستقبلة للطلبات
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    
    // 💡 نأخذ الـ userId المرسل من الفرونت إند، وإذا لم يوجد نضع قيمة افتراضية حتى لا يفشل الطلب
    const userId = searchParams.get("userId") || "demo-user-1";

    if (provider === "notik") {
      const notikOffers = await fetchNotik(userId);
      return NextResponse.json({ status: "success", data: notikOffers });
    }

    // الوضع الافتراضي (دمج كل الشركات)
    const results = await Promise.allSettled([
      fetchNotik(userId),
      // هنا تضيف الشركات الأخرى مستقبلاً وتمرر لها الـ userId إن تطلب الأمر
    ]);

    const allOffers = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    // ترتيب العروض من الأعلى نقاطاً للأقل
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
