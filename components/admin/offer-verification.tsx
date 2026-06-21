"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react"

interface CompletedOffer {
  id: string
  offerwall: string
  offerName: string
  points: number
  amountUSD: number
  offerIp: string | null
  registrationIp: string | null
  lastLoginIp: string | null
  ipMismatch: boolean
}

export function OfferVerification({ userId }: { userId: string }) {
  const [offers, setOffers] = useState<CompletedOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const q = query(
          collection(db, "completed_offers"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(100),
        )
        const snap = await getDocs(q)
        if (!active) return
        setOffers(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              offerwall: data.offerwall || "Unknown",
              offerName: data.offerName || "Offer",
              points: data.points || 0,
              amountUSD: data.amountUSD || 0,
              offerIp: data.offerIp || null,
              registrationIp: data.registrationIp || null,
              lastLoginIp: data.lastLoginIp || null,
              ipMismatch: !!data.ipMismatch,
            }
          }),
        )
      } catch (err) {
        console.error("[v0] offer verification load error:", err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading offer history...
      </div>
    )
  }

  if (offers.length === 0) {
    return <p className="py-4 text-sm text-white/40">No completed offers recorded for this user.</p>
  }

  const flaggedCount = offers.filter((o) => o.ipMismatch).length

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">Completed Offers ({offers.length})</span>
        {flaggedCount > 0 ? (
          <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {flaggedCount} IP mismatch
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
            <ShieldCheck className="mr-1 h-3 w-3" />
            All IPs consistent
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.03] text-white/50 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2">Offer</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Offer IP</th>
              <th className="px-3 py-2">Account IP</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {offers.map((o) => (
              <tr key={o.id} className={o.ipMismatch ? "bg-red-500/5" : ""}>
                <td className="px-3 py-2 text-white/80 max-w-[180px] truncate">{o.offerName}</td>
                <td className="px-3 py-2 text-white/60">{o.offerwall}</td>
                <td className="px-3 py-2 font-medium text-white/80">{o.points.toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-white/60">{o.offerIp || "—"}</td>
                <td className="px-3 py-2 font-mono text-white/40">
                  {o.registrationIp || o.lastLoginIp || "—"}
                </td>
                <td className="px-3 py-2">
                  {o.ipMismatch ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                      <AlertTriangle className="h-3 w-3" /> VPN/Proxy?
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
