import { NextResponse } from 'next/server';

export async function GET() {
    const orderId = "662154"; 
    const apiKey = process.env.PROXY_CHEAP_API_KEY;
    const apiSecret = process.env.PROXY_CHEAP_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 'Missing API Keys' }, { status: 500 });
    }

    try {
        const response = await fetch(`https://api.proxy-cheap.com/residential/orders/${orderId}/proxies`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey,
                'X-Api-Secret': apiSecret
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Proxy-Cheap Error: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
