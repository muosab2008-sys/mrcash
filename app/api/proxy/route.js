import { NextResponse } from 'next/server';

export async function GET() {
    // وضعنا رقم طلبك الحالي مباشرة من الفاتورة لتسهيل الربط تلقائياً
    const orderId = "662154";

    const apiKey = process.env.PROXY_CHEAP_API_KEY;
    const apiSecret = process.env.PROXY_CHEAP_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json(
            { error: 'مفاتيح الـ API غير معرفة في إعدادات Vercel!' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(`https://api.proxy-cheap.com/orders/${orderId}/proxies`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey,
                'X-Api-Secret': apiSecret
            },
            next: { revalidate: 10 } 
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `فشل الاتصال بـ Proxy-Cheap: status ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        return NextResponse.json(
            { error: `خطأ داخلي في الخادم: ${error.message}` },
            { status: 500 }
        );
    }
}
