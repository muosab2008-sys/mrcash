Skip to content
muosab2008-sys
mrcash
Repository navigation
Code
Issues
Pull requests
Agents
Actions
Projects
Wiki
Security and quality
1
 (1)
Insights
Settings
mrcash/app/api/postback/upwal
/
route.ts
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing route.ts file contents
  1
  2
  3
  4
  5
  6
  7
  8
  9
 10
 11
 12
 13
 14
 15
 16
 17
 18
 19
 20
 21
 22
 23
 24
 25
 26
 27
 28
 29
 30
 31
 32
 33
 34
 35
 36
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleUpWallPostback(request);
}

export async function POST(request: NextRequest) {
  return handleUpWallPostback(request);
}

async function handleUpWallPostback(request: NextRequest) {
  try {
    // 1. جلب المعالم القادمة من الرابط (Query Parameters)
    const { searchParams } = new URL(request.url);
    const rawData = Object.fromEntries(searchParams.entries());

    // 2. مسك متغيرات UpWall الرسمية المذكورة في التوثيق
    let userId = rawData.userid;
    let userAmountRaw = rawData.user_amount;
    let offerName = rawData.offer_name || 'UpWall Offer';
    let payoutRaw = rawData.payout || '0';
    let txid = rawData.transactionID || rawData.transactionid || `uw_${Date.now()}`;

    // 🎯 نظام ذكي جداً: إذا كانت اللوحة ترسل الماكرو فارغاً {userid} أو قيم تجريبية، يتم الشحن لحسابك الشخصي
    const isTestRequest = 
      !userId || 
      userId === "user1234" || 
      userId === "user-pub-001" || 
      userId === "{userid}" ||
      String(userId).toLowerCase().includes('test');

    if (isTestRequest) {
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
 
Copied!
