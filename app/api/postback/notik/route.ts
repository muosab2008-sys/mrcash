import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المتغيرات الأساسية التي يرسلها نظام Notik تلقائياً
    const txn_id = searchParams.get('txn_id');
    const user_id = searchParams.get('user_id');
    const amountRaw = searchParams.get('amount');
    const hash = searchParams.get('hash');
    const secretKey = process.env.NOTIK_SECRET_KEY || ""; // تأكد من وجوده في ملف .env

    // إذا كانت البيانات الأساسية ناقصة، نرفض الطلب فوراً لسلامة السيرفر
    if (!txn_id || !user_id || !hash || !amountRaw) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // تحويل النقاط إلى رقم واستخدام Math.floor للتخلص من أي فواصل عشرية قادمة نهائياً
    const amount = Math.floor(Number(amountRaw));

    // 2. التحقق الآمن من الـ Hash بحسب معايير Notik الرسمية
    const fullUrl = request.url;
    let urlWithoutHash = fullUrl;
    
    // إزالة متغير الـ hash فقط من الرابط لإعادة توليده ومقارنته
    if (fullUrl.includes(`&hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`&hash=${hash}`, '');
    } else if (fullUrl.includes(`?hash=${hash}`)) {
      urlWithoutHash = fullUrl.replace(`?hash=${hash}`, '');
    }

    const generatedHash = crypto
      .createHmac('sha1', secretKey)
      .update(urlWithoutHash)
      .digest('hex');

    if (generatedHash !== hash) {
      console.error("Security: Hash mismatch.");
      return new NextResponse('Invalid Hash', { status: 400 });
    }

    // 3. حماية ضد تكرار المعاملات (ثغرة الشحن المتكرر)
    const txRef = doc(db, 'transactions', txn_id);
    const txSnap = await getDoc(txRef);
    
    if (txSnap.exists()) {
      // إذا كانت المعاملة مسجلة مسبقاً، نرد بـ OK دون إضافة نقاط جديدة لحماية رصيدك
      return new NextResponse('OK', { status: 200 }); 
    }

    // 4. قراءة تفاصيل العرض الاختيارية
    const offer_name = searchParams.get('offer_name') || "Notik Offer";
    const event_name = searchParams.get('event_name') || "Main Task";

    const userRef = doc(db, 'users', user_id);

    // 5. تسجيل المعاملة وتحديث رصيد حساب المستخدم بالكامل
    await setDoc(txRef, {
      userId: user_id,
      amount: amount,
      offerName: offer_name,
      eventName: event_name,
      status: amount >= 0 ? 'completed' : 'charged_back',
      timestamp: serverTimestamp()
    });

    // إضافة النقاط الصافية (بدون فواصل) إلى حقل الـ balance الخاص بالمستخدم في Firestore
    await updateDoc(userRef, {
      balance: increment(amount)
    });

    // الرد الفوري بـ OK للحصول على كود 200 كما يطلب النظام
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error("Postback Crash Error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
