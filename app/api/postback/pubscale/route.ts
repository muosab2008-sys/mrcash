import { NextRequest, NextResponse } from 'next/server';
import { handleSuccessfulPostback } from '@/lib/postback-helper';
import crypto from 'crypto'; 

export const dynamic = 'force-dynamic';

// 🚨 المفتاح السري الحقيقي الخاص بك من لوحة PubScale
const PUBSCALE_SECRET_KEY = "debb3049-9ccd-48c4-a0ae-38381db057a2";

// قائمة الـ IPs المعتمدة والموثقة رسميًا من PubScale للحماية الشاملة
const PUBSCALE_TRUSTED_IPS = ['34.100.236.68', '34.100.128.195', '34.14.172.7'];

export async function GET(request: NextRequest) {
  try {
    // 1. نظام جدار الحماية للتحقق من الـ IP الخاص بـ PubScale
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات القادمة من الرابط بالملي
    let userId = searchParams.get('user_id');            
    const token = searchParams.get('token'); 
    const valueRaw = searchParams.get('value'); 
    const signature = searchParams.get('signature');
    
    const offerName = searchParams.get('offer_name') || 'PubScale Task';
    const goalName = searchParams.get('goal_name') || '';
    const payoutUsd = searchParams.get('payout_usd') || '0';

    // التحقق من وجود المتغيرات الأساسية
    if (!userId || !token || !valueRaw || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // القيمة الرقمية الحقيقية بالفواصل لشحن الحساب بدقة
    const pointsToReward = parseFloat(valueRaw);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid reward value' }, { status: 400 });
    }

    // كشف طلبات الفحص التجريبية لتسهيل تفعيل الرابط بداخل لوحة التحكم
    const isTestRequest = 
      token.toLowerCase().includes('test') || 
      userId.toLowerCase().includes('test') || 
      userId === "duO5FMkYkNTPUr9gi283LHoulOu2";

    // 🔒 2. جدار الحماية الأمني (التحقق من الـ IP والـ Signature) في الإنتاج الحقيقي 🔒
    if (!isTestRequest) {
      // أ) التحقق من الـ IP الموثق
      if (clientIp && !PUBSCALE_TRUSTED_IPS.includes(clientIp)) {
        console.error(`❌ PubScale Security Warning: Unauthorized IP blocked: ${clientIp}`);
        return NextResponse.json({ error: 'Unauthorized IP address' }, { status: 403 });
      }

      // ب) التحقق من الـ Hash بناءً على معادلة التوثيق: secret_key.user_id.points(integer).token
      const pointsForSignature = Math.floor(pointsToReward); // تحويل القيمة لعدد صحيح من أجل الهاش فقط كما يطلب النظام
      const template = `${PUBSCALE_SECRET_KEY}.${userId}.${pointsForSignature}.${token}`;
      const calculatedSignature = crypto.createHash('md5').update(template).digest('hex');

      if (signature.toLowerCase() !== calculatedSignature.toLowerCase()) {
        console.error('❌ PubScale Security Warning: Signature Mismatch!');
        return NextResponse.json({ error: 'Invalid hash signature' }, { status: 401 });
      }
    }

    // تأمين حساب تجريبي للاختبار إذا تم إرسال الطلب من أداة الفحص بمعرف افتراضي
    if (userId === "duO5FMkYkNTPUr9gi283LHoulOu2" || userId.toLowerCase().includes('test') || !userId) {
      userId = "YjkvTqAkpMhpmj6ts19g6bvhBDx1"; 
    }

    const displayGoal = goalName ? ` - ${goalName}` : '';
    const finalOfferTitle = `${offerName}${displayGoal}`;

    // 3. 🔥 تشغيل المعالج الموحد: شحن الرصيد + اللايف فيد + الإشعار + الـ Web Push 🔥
    const result = await handleSuccessfulPostback({
      userIdentifier: userId,
      points: pointsToReward,
      offerName: finalOfferTitle,
      source: 'PubScale',
      transactionId: `pubscale_${token}`, // منع التكرار باستخدام التوكن الخاص بالعرض
      payoutUsd: parseFloat(payoutUsd),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    console.log(`[PubScale Success] ${result.message}`);
    return NextResponse.json({ success: true, message: 'PubScale postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[PubScale Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// دعم الـ POST احتياطياً لتأمين استقبال الطلبا�� بكافة الأحوال
export async function POST(request: NextRequest) {
  return GET(request);
}
