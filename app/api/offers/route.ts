async function fetchNotik() {
  try {
    const res = await fetch(
      "https://notik.me/api/v2/get-offers?api_key=NofGnODVnHB3werypR5PRKx5ew8fTbB4&pub_id=Yog41D&app_id=psPQDvAS3y",
      { cache: "no-store" }
    );
    
    if (!res.ok) return [];
    const json = await res.json();
    
    // 🔍 أضف هذا السطر لكي ترى الرد الحقيقي في الـ Logs داخل Vercel
    console.log("NOTIK RAW RESPONSE:", json);
    
    // إذا كانت Notik ترسل البيانات داخل حقل آخر غير offers، سنعرفه من هنا
    return (json.offers || []).map((item: any) => ({
      id: `notik-${item.id}`,
      name: item.title,
      description: item.description,
      provider: "Notik",
      payout: parseFloat(item.payout),
      mcPoints: Math.round(parseFloat(item.payout) * 1000),
      image: item.image_url,
      url: `${item.click_url}&user_id=[USER_ID]`,
    }));
  } catch (e) {
    console.error("Error fetching Notik:", e);
    return [];
  }
}
