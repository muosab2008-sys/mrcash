import { FieldValue } from "firebase-admin/firestore"
import type { HostLogEntry, SharedIp, FraudFlags, HostLogResult } from "@/lib/fraud-types"

export type { HostLogEntry, SharedIp, FraudFlags, HostLogResult } from "@/lib/fraud-types"

/**
 * Anti-fraud + IP tracking engine (server-only).
 *
 * Responsibilities:
 *  - Record login / registration IP addresses onto the user profile.
 *  - Build the withdrawal "Host Log": per-offer history with offerwall,
 *    offer name and the IP used to complete it.
 *  - Flag duplicate IPs shared across multiple accounts and proxy/VPN-style
 *    IP mismatches between login and offer-completion activity.
 */

type Db = FirebaseFirestore.Firestore

const MAX_IP_HISTORY = 25
const MAX_LOG_ENTRIES = 150

function toIso(value: unknown): string | null {
  if (!value) return null
  // Firestore Timestamp
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return null
    }
  }
  if (value instanceof Date) return value.toISOString()
  return null
}

/**
 * Records the IP used for a login / registration / oauth session onto the
 * user's profile and appends it to the `login_events` audit collection.
 */
export async function recordSessionIp(
  adminDb: Db,
  uid: string,
  ip: string,
  type: "login" | "register" | "google",
  userAgent?: string,
): Promise<void> {
  if (!uid || !ip) return

  const userRef = adminDb.collection("users").doc(uid)

  await adminDb.collection("login_events").add({
    userId: uid,
    ip,
    type,
    userAgent: userAgent || null,
    createdAt: FieldValue.serverTimestamp(),
  })

  const update: Record<string, unknown> = {
    lastIp: ip,
    lastLoginAt: FieldValue.serverTimestamp(),
    ipHistory: FieldValue.arrayUnion(ip),
  }
  if (type === "register") {
    update.signupIp = ip
  }

  // merge:true so this works even if the profile is created moments later.
  await userRef.set(update, { merge: true })

  // Trim ipHistory so it never grows unbounded.
  try {
    const snap = await userRef.get()
    const history: string[] = snap.data()?.ipHistory || []
    if (history.length > MAX_IP_HISTORY) {
      await userRef.update({ ipHistory: history.slice(-MAX_IP_HISTORY) })
    }
  } catch {
    /* non-fatal */
  }
}

/** Collects the distinct set of IPs associated with a user. */
async function collectUserIps(
  adminDb: Db,
  uid: string,
  transactions: FirebaseFirestore.QueryDocumentSnapshot[],
): Promise<{ loginIps: string[]; offerIps: string[] }> {
  const loginIps = new Set<string>()
  const offerIps = new Set<string>()

  const userSnap = await adminDb.collection("users").doc(uid).get()
  const userData = userSnap.data() || {}
  if (userData.lastIp) loginIps.add(userData.lastIp)
  if (userData.signupIp) loginIps.add(userData.signupIp)
  for (const ip of userData.ipHistory || []) loginIps.add(ip)

  const loginEvents = await adminDb
    .collection("login_events")
    .where("userId", "==", uid)
    .limit(100)
    .get()
  for (const doc of loginEvents.docs) {
    const ip = doc.data().ip
    if (ip) loginIps.add(ip)
  }

  for (const doc of transactions) {
    const ip = doc.data().userIp
    if (ip && ip !== "0.0.0.0") offerIps.add(ip)
  }

  loginIps.delete("0.0.0.0")
  return { loginIps: [...loginIps], offerIps: [...offerIps] }
}

/** For a given IP, finds other account IDs that have used it. */
async function findAccountsForIp(adminDb: Db, ip: string, excludeUid: string): Promise<string[]> {
  const accounts = new Set<string>()

  const byLogin = await adminDb.collection("login_events").where("ip", "==", ip).limit(50).get()
  for (const doc of byLogin.docs) {
    const uid = doc.data().userId
    if (uid && uid !== excludeUid) accounts.add(uid)
  }

  const byTx = await adminDb.collection("transactions").where("userIp", "==", ip).limit(50).get()
  for (const doc of byTx.docs) {
    const uid = doc.data().userId
    if (uid && uid !== excludeUid) accounts.add(uid)
  }

  const byProfile = await adminDb.collection("users").where("lastIp", "==", ip).limit(50).get()
  for (const doc of byProfile.docs) {
    if (doc.id !== excludeUid) accounts.add(doc.id)
  }

  return [...accounts]
}

/**
 * Builds the full Host Log + fraud flags for a user. Used by both the user's
 * own Account Hub and the admin withdrawals review screen.
 */
export async function buildHostLog(adminDb: Db, uid: string): Promise<HostLogResult> {
  // 1. Pull this user's offer-completion history.
  const txSnap = await adminDb
    .collection("transactions")
    .where("userId", "==", uid)
    .limit(MAX_LOG_ENTRIES)
    .get()

  const txDocs = txSnap.docs
  const entries: HostLogEntry[] = txDocs
    .map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        offerwall: d.offerwall || d.offerwallName || "Unknown",
        offerName: d.offerName || "Offer",
        ip: d.userIp || "Unknown",
        points: d.points || 0,
        amountUSD: d.amountUSD ?? d.payout ?? 0,
        status: d.status || "completed",
        createdAt: toIso(d.createdAt),
      }
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

  // 2. Collect the user's IP footprint.
  const { loginIps, offerIps } = await collectUserIps(adminDb, uid, txDocs)

  // 3. Detect IPs shared across multiple accounts.
  const allIps = [...new Set([...loginIps, ...offerIps])].slice(0, MAX_IP_HISTORY)
  const sharedIps: SharedIp[] = []
  for (const ip of allIps) {
    const accounts = await findAccountsForIp(adminDb, ip, uid)
    if (accounts.length > 0) {
      sharedIps.push({ ip, accounts })
    }
  }

  // 4. Heuristic proxy/VPN + multi-account scoring.
  const reasons: string[] = []
  let riskScore = 0

  const multiAccount = sharedIps.length > 0
  if (multiAccount) {
    const totalLinked = new Set(sharedIps.flatMap((s) => s.accounts)).size
    riskScore += Math.min(50, 20 + totalLinked * 10)
    reasons.push(
      `${sharedIps.length} IP address(es) shared with ${totalLinked} other account(s).`,
    )
  }

  // IP mismatch: offers completed from IPs never seen at login suggests
  // proxy/VPN rotation or shared completion farms.
  const offerOnlyIps = offerIps.filter((ip) => !loginIps.includes(ip))
  const ipMismatch = offerIps.length > 0 && offerOnlyIps.length > 0
  if (ipMismatch) {
    riskScore += Math.min(30, offerOnlyIps.length * 10)
    reasons.push(
      `${offerOnlyIps.length} offer(s) completed from IP(s) that differ from login IP(s) (possible proxy/VPN).`,
    )
  }

  // Excessive distinct offer IPs is itself a rotation signal.
  const proxySuspected = ipMismatch || offerIps.length >= 4
  if (offerIps.length >= 4) {
    riskScore += 20
    reasons.push(`Offers completed from ${offerIps.length} distinct IP addresses.`)
  }

  riskScore = Math.min(100, riskScore)
  const riskLevel: FraudFlags["riskLevel"] = riskScore >= 60 ? "high" : riskScore >= 25 ? "medium" : "low"

  if (reasons.length === 0) reasons.push("No suspicious activity detected.")

  return {
    entries,
    flags: {
      riskScore,
      riskLevel,
      multiAccount,
      proxySuspected,
      ipMismatch,
      sharedIps,
      loginIps,
      offerIps,
      reasons,
    },
  }
}
