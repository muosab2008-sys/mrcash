import { NextResponse } from "next/server";
import { headers } from "next/headers";

// 1. دالة جلب العروض مع تمرير بيانات الزائر الحقيقي (IP و User-Agent)
async function fetchNotik(userId: string, userIp: string, userAgent: string) {
  try {
    const url = `https://notik.me/api/v1/live-campaigns-for-user?api_key=NofGnODVnHB3werypR5PRKx5ew8fTbB4&pub_id=Yog41D&app_id=psPQDvAS3y&user_id=${userId}&duration=30d&page=1`;
    
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        // 🔥 السر هنا: نخدع Notik ونخبرها أن الطلب قادم من متصفح المستخدم وليس من السيرفر
        "X-Forwarded-For": userIp,
        "User-Agent": userAgent,
      }
    });

    if (!res.ok) return [];
    
    const json = await res.json();
    const campaigns = json.data || [];
    
    return campaigns.map((item: any) => ({
      id: `notik-${item.offer_id}`,
      name: item.name,
      description: item.description1 || item.description2 || "Complete this offer to earn MC",
      provider: "Notik",
      payout: parseFloat(item.payout),
      mcPoints: Math.round(parseFloat(item.payout) * 1000), 
      image: item.image_url,
      url: item.click_url, 
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
    const userId = searchParams.get("userId") || "demo-user-1";

    // 🌐 التقاط الـ IP والـ User-Agent الحقيقيين للمستخدم المتصفح الآن
    const reqHeaders = await headers();
    
    // جلب الـ IP (يتعامل مع صيغ Vercel المختلفة للـ IP)
    const forwardedFor = reqHeaders.get("x-forwarded-for");
    const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : "1.1.1.1"; 
    
    // جلب نوع المتصفح والجهاز
    const userAgent = reqHeaders.get("user-agent") || "";

    if (provider === "notik") {
      const notikOffers = await fetchNotik(userId, userIp, userAgent);
      return NextResponse.json({ status: "success", data: notikOffers });
    }

    // دمج الشركات
    const results = await Promise.allSettled([
      fetchNotik(userId, userIp, userAgent),
    ]);

    const allOffers = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

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
