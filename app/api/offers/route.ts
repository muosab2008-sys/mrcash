async function fetchNotik() {
  try {
    // الرابط الصحيح مدمجاً به بيانات تطبيقك من Notik
    const res = await fetch("https://notik.me/api/v2/get-offers?api_key=NofGnODVnHB3werypR5PRKx5ew8fTbB4&pub_id=Yog41D&app_id=psPQDvAS3y");
    
    const json = await res.json();
    
    // تحويل البيانات لتطابق صيغة موقعك الموحدة
    return (json.offers || []).map((item: any) => ({
      id: `notik-${item.id}`,
      name: item.title,
      description: item.description,
      provider: "Notik",
      payout: parseFloat(item.payout),
      // حساب النقاط بناءً على الـ Payout (عدلها حسب عملة موقعك)
      mcPoints: Math.round(parseFloat(item.payout) * 1000), 
      image: item.image_url,
      // هنا نقوم بتجهيز رابط العرض ونضع الماكرو [USER_ID] ليتم استبداله في الفرونت إند بـ UID المستخدم الحقيقي
      url: `${item.click_url}&user_id=[USER_ID]`,
    }));
  } catch (e) { 
    console.error("Error fetching Notik offers:", e);
    return []; 
  }
}
