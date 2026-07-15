import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.PROXY_CHEAP_API_KEY;
    const apiSecret = process.env.PROXY_CHEAP_API_SECRET;

    // 1. التحقق الفوري إذا كانت المفاتيح فارغة في بيئة Vercel
    if (!apiKey || !apiSecret) {
        return NextResponse.json({ 
            error: 'خطأ حاسم: مفاتيح البيئة PROXY_CHEAP_API_KEY أو PROXY_CHEAP_API_SECRET غير معرفة في إعدادات Vercel!' 
        }, { status: 500 });
    }

    try {
        // سنحاول الاتصال بأبسط مسار لمعلومات الحساب لمعرفة سبب الرفض
        const res = await fetch('https://api.proxy-cheap.com/users/me', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey,
                'X-Api-Secret': apiSecret
            }
        });

        const status = res.status;
        
        // جلب نص الخطأ الخام القادم من سيرفر Proxy-Cheap
        const rawText = await res.text();
        let detail = rawText;
        try {
            const parsed = JSON.parse(rawText);
            detail = parsed.message || parsed.error || rawText;
        } catch(e) {}

        // إذا أعاد السيرفر أي خطأ (مثل 401 Unauthorized أو 403 Forbidden)
        if (!res.ok) {
            return NextResponse.json({
                error: `فشل المصادقة مع سيرفر Proxy-Cheap (كود الخطأ: ${status})`,
                server_response: detail,
                suggestion: 'تأكد من مطابقة الـ API Key والـ Secret الحاليين مع اللوحة في حسابك، وتأكد من حفظهم في إعدادات Vercel Environment Variables.'
            }, { status: status });
        }

        // إذا نجح الاتصال (وهذا مستبعد حالياً)، سيعيد البيانات
        return NextResponse.json({ success: true, data: JSON.parse(rawText) });

    } catch (error) {
        return NextResponse.json({ error: 'خطأ في الاتصال بالشبكة', details: error.message }, { status: 500 });
    }
}
