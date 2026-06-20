export interface FaucetPayResult {
  ok: boolean;
  status: number;
  data: any;
  error?: string;
}

/**
 * Sends an instant FaucetPay payout.
 * The API key is read from the FAUCETPAY_API_KEY environment variable (never hardcoded).
 *
 * @param to       Destination FaucetPay email / wallet address
 * @param amount   Amount in the smallest accepted unit for the currency (string)
 * @param currency Currency ticker (e.g. "USDT", "LTC", "BTC")
 */
export async function faucetPaySend(to: string, amount: string, currency: string): Promise<FaucetPayResult> {
  const apiKey = process.env.FAUCETPAY_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, data: null, error: "Missing FAUCETPAY_API_KEY environment variable." };
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    amount,
    to,
    currency,
  });

  const res = await fetch("https://faucetpay.io/api/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  // FaucetPay returns { status: 200, ... } on success
  const success = res.ok && data?.status === 200;

  return {
    ok: success,
    status: res.status,
    data,
    error: success ? undefined : data?.message || "FaucetPay payout failed",
  };
}
