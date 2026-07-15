import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.PROXY_CHEAP_API_KEY;
    const apiSecret = process.env.PROXY_CHEAP_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 'مفاتيح الـ API غير معرفة في Vercel!' }, { status: 500 });
    }

    try {
        // 1. جلب قائمة الطلبات (Orders) لمعرفة الـ ID النشط تلقائياً كما يوضح التوثيق
        const ordersResponse = await fetch('https://api.proxy-cheap.com/residential/orders', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey,
                'X-Api-Secret': apiSecret
            }
        });

        if (!ordersResponse.ok) {
            return NextResponse.json({ error: `خطأ في جلب الطلبات: ${ordersResponse.status}` }, { status: ordersResponse.status });
        }

        const ordersData = await ordersResponse.json();

        if (!ordersData || ordersData.length === 0) {
            return NextResponse.json({ error: 'لا يوجد أي طلب أو اشتراك نشط في الحساب.' }, { status: 404 });
        }

        // اختيار أول طلب نشط
        const activeOrder = ordersData.find(order => order.status === 'ACTIVE') || ordersData[0];
        const dynamicOrderId = activeOrder.id;

        // 2. محاولة جلب تفاصيل البروكسي الحية التابعة لهذا الطلب
        const proxyResponse = await fetch(`https://api.proxy-cheap.com/residential/orders/${dynamicOrderId}/proxies`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey,
                'X-Api-Secret': apiSecret
            }
        });

        // إذا كان المسار الفرعي يعطي 404، نقوم بإرجاع بيانات الطلب نفسه لأنها تحتوي غالباً على بيانات الاتصال
        if (!proxyResponse.ok) {
            return NextResponse.json([activeOrder]);
        }

        const proxyData = await proxyResponse.json();
        return NextResponse.json(Array.isArray(proxyData) ? proxyData : [proxyData]);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
