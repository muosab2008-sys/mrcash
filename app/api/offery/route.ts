import { NextResponse } from 'next/server';

export async function GET() {
  const API_KEY = process.env.OFFERY_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json({ status: "error", message: "API Key is missing" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://offery.io/api/?apikey=${API_KEY}`, {
      cache: 'no-store' // عشان العروض تتحدث دائماً وما تعلق
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to fetch from Offery" }, { status: 500 });
  }
}