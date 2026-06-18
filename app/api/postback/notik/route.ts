import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المتغيرات الأساسية كما هي مذكورة في التوثيق
    const txn_id = searchParams.get('txn_id');
    const user_id = searchParams.get('user_id');
    const amountRaw = searchParams.get('amount');
    const hash = searchParams.get('hash');
    const secretKey = process.env.NOTIK_SECRET_KEY || ""; 

    // إذا كانت البيانات الأساسية ناقصة، نرفض الطلب فوراً
    if (!txn_id || !user_id || !hash || !amountRaw) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const amount = Number(amountRaw);

    // 2. التحقق من الـ Hash (مطابقة تامة لطريقة Notik المذكورة في مستند الـ PHP)
    // نأخذ الرابط الكامل للطلب الحالي
    const fullUrl = request.url;
    
    // نقوم بقص الـ hash من نهاية الرابط تماماً كما يفعل كود الشركة (substr)
    let urlWithoutHash = fullUrl;
    if (fullUrl.includes(`&hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`&hash=${hash}`, '');
    } else if (fullUrl.includes(`?hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`?hash=${hash}`, '');
    }

    // توليد الـ Hash المعتمد بـ sha1 HMAC
    const generatedHash = crypto
      .createHmac('sha1', secretKey)
      .update(urlWithoutHash)
      .digest('hex');

    // مقارنة الـ Hash المرسل مع الـ Hash الذي قمنا بتوليده
    if (generatedHash !== hash) {
      console.error("Security Warning: Invalid Hash detected.");
      return new NextResponse('Invalid Hash', { status: 400 });
    }

    // 3. منع التكرار (Check Duplicate Transaction)
    const txRef = doc(db, 'transactions', txn_id);
    const txSnap = await getDoc(txRef);
    
    if (txSnap.exists()) {
      // التوثيق يقول: إذا كانت المعاملة مكررة، لا تحسب نقاطاً جديدة ولكن رد بـ 200 OK لتأكيد الاستلام
      return new NextResponse('OK', { status: 200 }); 
    }

    // 4. استخراج بيانات الأحداث الإضافية لحفظها في السجل (مثل اسم المرحلة الإضافية)
    const event_name = searchParams.get('event_name') || "Main Offer";
    const offer_name = searchParams.get('offer_name') || "Unknown Offer";

    const userRef = doc(db, 'users', user_id);

    // 5. تسجيل العملية في قاعدة البيانات وتحديث الرصيد
    // (حالة الـ Chargeback تكون فيها القيمة سالبة وسيتم خصمها تلقائياً بفضل دومة increment)
    await setDoc(txRef, {
      userId: user_id,
      amount: amount,
      offerName: offer_name,
      eventName: event_name,
      status: amount >= 0 ? 'completed' : 'charged_back',
      timestamp: serverTimestamp()
    });

    // تحديث رصيد المستخدم النهائي بالـ amount القادم مباشرة من الشركة
    await updateDoc(userRef, {
      balance: increment(amount)
    });

    // التوثيق يطلب رداً سريعاً بـ 200 وكلمة OK خلال أقل من 15 ثانية
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error("Postback Internal Error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
