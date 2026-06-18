import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المتغيرات الأساسية
    const txn_id = searchParams.get('txn_id');
    const user_id = searchParams.get('user_id');
    const amountRaw = searchParams.get('amount');
    const hash = searchParams.get('hash');
    const secretKey = process.env.NOTIK_SECRET_KEY || ""; 

    // إذا كانت المعلمات الأساسية ناقصة، نرد بـ 400 مع توضيح السبب في الـ Logs
    if (!txn_id || !user_id || !hash || !amountRaw) {
      console.error("Postback Error: Missing parameters", { txn_id, user_id, hash, amountRaw });
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const amount = Math.floor(Number(amountRaw));

    // 2. 🛠️ إعادة بناء الرابط الخام بدقة 100% كما استقبله السيرفر لمنع فشل الـ Hash
    const headers = request.headers;
    const protocol = headers.get('x-forwarded-proto') || 'https';
    const host = headers.get('x-forwarded-host') || headers.get('host') || 'mrcash.app';
    
    // استخراج الجزء النصي المكتوب بعد الدومين (يشمل المتغيرات وعلامات الاستفهام)
    const requestUri = request.url.substring(request.url.indexOf('/api/'));
    
    // الرابط الكامل الفعلي
    const fullUrl = `${protocol}://${host}${requestUri}`;
    
    // إعادة بناء طريقة الـ PHP (substr) لقص الـ hash من نهاية الرابط تماماً
    // التوثيق يمسح الجزء الخاص بـ &hash=... من نهاية الرابط للاختبار
    let urlWithoutHash = fullUrl;
    if (fullUrl.includes(`&hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`&hash=${hash}`, '');
    } else if (fullUrl.includes(`?hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`?hash=${hash}`, '');
    }

    // توليد الـ Hash للمقارنة
    const generatedHash = crypto
      .createHmac('sha1', secretKey)
      .update(urlWithoutHash)
      .digest('hex');

    // إذا لم يتطابق الـ Hash، نقوم بطباعته في الـ Logs لمعاينته ومعرفة الفرق، ونرفض المعاملة
    if (generatedHash !== hash) {
      console.error("Security Alert: Hash mismatch!", {
        received: hash,
        generated: generatedHash,
        testedUrl: urlWithoutHash
      });
      return new NextResponse('Invalid Hash', { status: 400 });
    }

    // 3. منع التكرار
    const txRef = doc(db, 'transactions', txn_id);
    const txSnap = await getDoc(txRef);
    
    if (txSnap.exists()) {
      return new NextResponse('OK', { status: 200 }); 
    }

    // 4. قراءة البيانات الإضافية وتحديث رصيد المستخدم
    const offer_name = searchParams.get('offer_name') || "Notik Offer";
    const event_name = searchParams.get('event_name') || "Main Task";

    const userRef = doc(db, 'users', user_id);

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

    // الرد بـ OK الصافية بنجاح 200
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error("Postback Notik Error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
