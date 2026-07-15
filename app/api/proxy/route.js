import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.PROXY_CHEAP_API_KEY;
    const apiSecret = process.env.PROXY_CHEAP_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 'مفاتيح الـ API غير معرفة في Vercel!' }, { status: 500 });
    }

    // قائمة بالمسارات المحتملة للـ API بناءً على نوع الباقة في حسابك
    const endpoints = [
        'https://api.proxy-cheap.com/residential/proxy',
        'https://api.proxy-cheap.com/residential/configuration',
        'https://api.proxy-cheap.com/users/me' // مسار احتياطي لجلب بيانات الحساب الأساسية
    ];

    for (const url of endpoints) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': apiKey,
                    'X-Api-Secret': apiSecret
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // لتوحيد صيغة البيانات المرتجعة للواجهة (تأمين الحقول الأساسية)
                const standardizedData = {
                    status: "ACTIVE",
                    connection: {
                        connectIp: data.connection?.connectIp || data.ip || "pr.proxy-cheap.com",
                        httpPort: data.connection?.httpPort || data.httpPort || 31112,
                        socks5Port: data.connection?.socks5Port || data.socks5Port || 31113
                    },
                    authentication: {
                        username: data.authentication?.username || data.username || "معرف_المستخدم",
                        password: data.authentication?.password || data.password || "كلمة_المرور"
                    }
                };

                return NextResponse.json([standardizedData]);
            }
        } catch (e) {
            // الاستمرار في المحاولة مع المسار التالي في حال حدوث خطأ في الشبكة
            continue;
        }
    }

    // إذا فشلت كل المسارات المباشرة، نعيد رسالة واضحة
    return NextResponse.json({ 
        error: 'تعذر الوصول لبيانات البروكسي المباشرة، يرجى التحقق من نوع الباقة النشطة في حسابك.' 
    }, { status: 404 });
}
