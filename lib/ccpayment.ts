import crypto from "crypto";

const CCPAYMENT_BASE = "https://api.ccpayment.com";

export interface CCPaymentResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  raw: string;
  error?: string;
}

function getCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.CCPAYMENT_APP_ID;
  const appSecret = process.env.CCPAYMENT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Missing CCPayment credentials. Set CCPAYMENT_APP_ID and CCPAYMENT_APP_SECRET.");
  }

  return { appId, appSecret };
}

/**
 * Builds the CCPayment authentication signature.
 * Per spec: HMAC-SHA256 over `Appid + Timestamp + JSON.stringify(body)` keyed by AppSecret.
 */
export function buildSignature(appId: string, appSecret: string, timestamp: string, bodyString: string): string {
  return crypto
    .createHmac("sha256", appSecret)
    .update(appId + timestamp + bodyString)
    .digest("hex");
}

/**
 * Verifies an inbound webhook signature using the same scheme.
 * Returns true only on a constant-time match.
 */
export function verifyWebhookSignature(timestamp: string, bodyString: string, receivedSign: string): boolean {
  try {
    const { appId, appSecret } = getCredentials();
    const expected = buildSignature(appId, appSecret, timestamp, bodyString);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(receivedSign || "", "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error("[v0] CCPayment signature verify failed:", (err as Error).message);
    return false;
  }
}

/**
 * Generic authenticated POST to the CCPayment API.
 * Signs the exact serialized body that is transmitted to avoid signature drift.
 */
export async function ccPaymentRequest<T = any>(path: string, body: Record<string, unknown>): Promise<CCPaymentResult<T>> {
  const { appId, appSecret } = getCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyString = JSON.stringify(body);
  const sign = buildSignature(appId, appSecret, timestamp, bodyString);

  const res = await fetch(`${CCPAYMENT_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Appid: appId,
      Timestamp: timestamp,
      Sign: sign,
    },
    body: bodyString,
  });

  const raw = await res.text();
  let data: T | null = null;
  try {
    data = raw ? (JSON.parse(raw) as T) : null;
  } catch {
    data = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    raw,
  };
}

/**
 * Executes an instant, fee-free internal cWallet transfer.
 */
export async function cwalletTransfer(params: {
  toUserId: string;
  coinId: number | string;
  amount: string;
  orderId: string;
  remark?: string;
}): Promise<CCPaymentResult> {
  return ccPaymentRequest("/ccpayment/v1/transfer/cwallet", {
    to_user_id: params.toUserId,
    coin_id: params.coinId,
    amount: params.amount,
    order_id: params.orderId,
    remark: params.remark || "MrCash payout",
  });
}

/**
 * Outbound double-check against the official CCPayment deposit/transaction ledger.
 */
export async function fetchDepositLedger(orderId: string): Promise<CCPaymentResult> {
  return ccPaymentRequest("/ccpayment/v1/billing/deposit/list", {
    order_id: orderId,
  });
}
