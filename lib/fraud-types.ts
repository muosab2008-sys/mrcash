// Client-safe shared types for the anti-fraud Host Log.
// Kept separate from fraud-utils.ts so client components can import the
// shapes without pulling in firebase-admin (server-only) code.

export interface HostLogEntry {
  id: string
  offerwall: string
  offerName: string
  ip: string
  points: number
  amountUSD: number
  status: string
  createdAt: string | null
}

export interface SharedIp {
  ip: string
  accounts: string[]
}

export interface FraudFlags {
  riskScore: number
  riskLevel: "low" | "medium" | "high"
  multiAccount: boolean
  proxySuspected: boolean
  ipMismatch: boolean
  sharedIps: SharedIp[]
  loginIps: string[]
  offerIps: string[]
  reasons: string[]
}

export interface HostLogResult {
  entries: HostLogEntry[]
  flags: FraudFlags
}
