import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج البيانات الأساسية
    const txn_id = searchParams.get('txn_id');
    const user_id = searchParams.get('user_id');
    const amountRaw = searchParams.get('amount') || searchParams.get('payout');
    const hash = searchParams.get('hash');
    const secretKey = process.env.NOTIK_SECRET_KEY || ""; 

    if (!txn_id || !user_id || !hash) {
      console.error("Postback Error: Missing parameters");
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const amount = amountRaw ? Math.floor(Number(amountRaw)) : 0;

    // 2. 🛠️ مطابقة معادلة الـ Hash الخاصة بـ PHP بالملي 🛠️
    const headers = request.headers;
    const protocol = headers.get('x-forwarded-proto') || 'https';
    const host = headers.get('x-forwarded-host') || headers.get('host') || 'mrcash.app';
    
    // جلب الـ URI الخام الممرر في المتصفح بالترتيب الأصلي للمتغيرات كما أرسلتها الشركة تماماً
    const requestUri = request.url.substring(request.url.indexOf('/api/'));
    
    // بناء الرابط الكامل الفعلي المستلم
    const fullUrl = `${protocol}://${host}${requestUri}`;
    
    // محاكاة سطر الـ PHP بالملي: إزالة الـ hash من نهاية النص تماماً بناءً على طول النص
    // Notik تفترض دائماً أن الـ hash هو آخر جزء في الرابط
    let urlWithoutHash = fullUrl;
    const hashParamString = `&hash=${hash}`;
    
    if (fullUrl.endsWith(hashParamString)) {
      urlWithoutHash = fullUrl.substring(0, fullUrl.length - hashParamString.length);
    } else if (fullUrl.includes(`?hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`?hash=${hash}`, '');
    }

    // توليد الـ Hash للمقارنة بـ sha1 hmac
    const generatedHash = crypto
      .createHmac('sha1', secretKey)
      .update(urlWithoutHash)
      .digest('hex');

    // 🔒 التحقق الأمني الصارم للإنتاج والاختبار معاً
    if (generatedHash !== hash) {
      console.error("Security Alert: Hash mismatch!", {
        received: hash,
        generated: generatedHash,
        testedUrl: urlWithoutHash
      });
      
      // 💡 إذا كنت تريد نجاح الاختبار في لوحة Notik حتى لو كان المفتاح السري (Secret Key) المكتوب في الـ .env يختلف عن اللوحة، يمكنك استبدال السطر التالي بـ return new NextResponse('OK', { status: 200 }); مؤقتاً للتجربة فقط.
      return new NextResponse('Invalid Hash', { status: 400 });
    }

    // 3. منع تكرار الشحن لنفس المعاملة
    const txRef = doc(db, 'transactions', txn_id);
    const txSnap = await getDoc(txRef);
    
    if (txSnap.exists()) {
      return new NextResponse('OK', { status: 200 }); 
    }

    // 4. تحديث قاعدة البيانات في Firestore للمستخدمين الحقيقيين والـ Test
    const userRef = doc(db, 'users', user_id);
    const isDummyTestUser = user_id === "123" || user_id === "1" || user_id.toLowerCase().includes('test');

    // إذا لم يكن مستخدماً تجريبياً وهمياً، قم بتحديث بياناته الحقيقية
    if (!isDummyTestUser) {
      const offer_name = searchParams.get('offer_name') || "Notik Offer";
      const event_name = searchParams.get('event_name') || "Main Task";

      await setDoc(txRef, {
        userId: user_id,
        amount: amount,
        offerName: offer_name,
        eventName: event_name,
        status: amount >= 0 ? 'completed' : 'charged_back',
        timestamp: serverTimestamp()
      });

      await updateDoc(userRef, {
        balance: increment(amount)
      });
    }

    // 5. الرد الناجح بـ 200 OK لتأكيد الاستلام
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error("Postback Notik Crash Error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
