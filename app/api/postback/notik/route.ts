import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المتغيرات الأساسية
    const txn_id = searchParams.get('txn_id') || "test_trx_" + Date.now();
    const user_id = searchParams.get('user_id');
    const amountRaw = searchParams.get('amount') || searchParams.get('payout') || "0";
    const hash = searchParams.get('hash');
    const secretKey = process.env.NOTIK_SECRET_KEY || ""; 

    if (!user_id) {
      console.error("Postback Error: Missing user_id");
      return new NextResponse('Missing user_id', { status: 400 });
    }

    const amount = Math.floor(Number(amountRaw));

    const txRef = doc(db, 'transactions', txn_id);
    const userRef = doc(db, 'users', user_id);
    
    // 2. منع تكرار شحن نفس المعاملة (ثغرة التكرار)
    const txSnap = await getDoc(txRef);
    if (txSnap.exists()) {
      console.log("Transaction already processed.");
      return new NextResponse('OK', { status: 200 }); 
    }

    const offer_name = searchParams.get('offer_name') || "Notik Offer";
    const event_name = searchParams.get('event_name') || "Main Task";

    // 3. تسجيل العملية في جدول المعاملات
    await setDoc(txRef, {
      userId: user_id,
      amount: amount,
      offerName: offer_name,
      eventName: event_name,
      status: amount >= 0 ? 'completed' : 'charged_back',
      timestamp: serverTimestamp()
    });

    // 4. 🔥 شحن وتحديث جميع الحقول في الفايربيس ومطابقتها للوحة التحكم الخاصة بك 🔥
    // قمنا بإضافة points و balance و totalEarned لضمان ظهورها في التطبيق فوراً
    await updateDoc(userRef, {
      points: increment(amount),       // شحن حقل النقاط الرئيسي في تطبيقك
      balance: increment(amount),      // شحن حقل الرصيد المتوافق مع السيرفر
      totalEarned: increment(amount >= 0 ? amount : 0) // زيادة إجمالي الأرباح التاريخية (فقط لو كانت القيمة موجبة)
    });

    console.log(`🎉 Successfully updated fields for user ${user_id} with ${amount} points.`);
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error("Postback Universal Exception:", error);
    return new NextResponse('OK', { status: 200 });
  }
}
