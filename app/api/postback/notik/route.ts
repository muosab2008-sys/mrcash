import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secretKey = process.env.NOTIK_SECRET_KEY || ""; 

    // 1. استخراج الـ hash المرسل
    const hash = searchParams.get('hash');
    
    // 2. التحقق من الـ Hash
    // Notik ترسل الرابط كاملاً، نحتاج للتحقق من النص قبل الـ hash
    const fullUrl = request.url;
    const urlWithoutHash = fullUrl.substring(0, fullUrl.lastIndexOf("&hash="));
    
    const generatedHash = crypto.createHmac('sha1', secretKey).update(urlWithoutHash).digest('hex');

    if (generatedHash !== hash) {
      console.error("Hash Mismatch! Expected:", generatedHash, "Received:", hash);
      return new NextResponse('Invalid Hash', { status: 400 });
    }

    // 3. استخراج البيانات بعد التأكد من صحة الـ Hash
    const txn_id = searchParams.get('txn_id');
    const user_id = searchParams.get('user_id');
    const amount = Number(searchParams.get('amount') || 0);

    if (!txn_id || !user_id) {
      return new NextResponse('Missing Params', { status: 400 });
    }

    // 4. العمليات على Firestore
    const txRef = doc(db, 'transactions', txn_id);
    const userRef = doc(db, 'users', user_id);
    const txSnap = await getDoc(txRef);

    if (txSnap.exists()) {
      return new NextResponse('OK', { status: 200 });
    }

    await setDoc(txRef, { userId: user_id, amount, status: 'completed' });
    await updateDoc(userRef, { balance: increment(amount), lastReward: amount });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error("Postback Error:", error);
    return new NextResponse('Error', { status: 400 });
  }
}
