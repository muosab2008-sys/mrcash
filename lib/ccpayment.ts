import { createHmac, timingSafeEqual } from "crypto";

const CCPAYMENT_BASE = "https://api.ccpayment.com/ccpayment/v1";

/**
 * Builds the HMAC-SHA256 signature CCPayment expects:
 *   sign = HMAC_SHA256( appId + timestamp + body, appSecret )
 */
export function buildCcSignature(timestamp: string, body: string): {
  appId: string;
  sign: string;
} {
  const appId = process.env.CCPAYMENT_APP_ID;
  const appSecret = process.env.CCPAYMENT_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("CCPayment credentials are not configured");
  }
  const payload = `${appId}${timestamp}${body}`;
  const sign = createHmac("sha256", appSecret).update(payload).digest("hex");
  return { appId, sign };
}

/** Constant-time comparison of two hex signatures. */
export function verifyCcSignature(expected: string, received: string): boolean {
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

interface CcRequestResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
}

/** Signed POST helper against the CCPayment API. */
export async function ccPost<T = any>(
  path: string,
  body: Record<string, unknown>,
): Promise<CcRequestResult<T>> {
  const appId = process.env.CCPAYMENT_APP_ID;
  if (!appId) throw new Error("CCPayment credentials are not configured");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const serialized = JSON.stringify(body);
  const { sign } = buildCcSignature(timestamp, serialized);

  const res = await fetch(`${CCPAYMENT_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Appid: appId,
      Timestamp: timestamp,
      Sign: sign,
    },
    body: serialized,
  });

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

/** Executes an instant, fee-free Cwallet internal transfer. */
export async function cwalletTransfer(params: {
  orderId: string;
  coinId: number;
  address: string;
  amount: string;
}) {
  return ccPost("/transfer/cwallet", {
    orderId: params.orderId,
    coinId: params.coinId,
    toAddress: params.address,
    amount: params.amount,
  });
}

/** Pulls the deposit/billing ledger to independently verify an order. */
export async function fetchCcDepositList(orderId: string) {
  return ccPost<{ code: number; data?: { records?: any[] } }>(
    "/billing/deposit/list",
    { orderId },
  );
}
