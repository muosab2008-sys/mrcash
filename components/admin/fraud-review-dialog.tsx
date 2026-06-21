"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Fingerprint,
  AlertTriangle,
} from "lucide-react";

interface FraudReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

interface OfferLog {
  id: string;
  offerName: string;
  offerwall: string;
  points: number;
  amountUSD: number;
  userIp: string;
  country: string;
  status: string;
  createdAt: Date | null;
}

interface IpLog {
  ip: string;
  event: string;
  country: string;
  createdAt: Date | null;
}

export function FraudReviewDialog({
  open,
  onOpenChange,
  userId,
  username,
}: FraudReviewDialogProps) {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferLog[]>([]);
  const [ipLogs, setIpLogs] = useState<IpLog[]>([]);
  const [registrationIp, setRegistrationIp] = useState<string>("");
  const [lastLoginIp, setLastLoginIp] = useState<string>("");

  useEffect(() => {
    if (!open || !userId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // User document (registration / last login IPs)
        const userSnap = await getDoc(doc(db, "users", userId));
        const userData = userSnap.exists() ? userSnap.data() : {};

        // Offer completions (transactions). Sorted client-side to avoid
        // requiring a composite Firestore index.
        const txSnap = await getDocs(
          query(collection(db, "transactions"), where("userId", "==", userId))
        );

        // IP login/registration history.
        const ipSnap = await getDocs(
          query(collection(db, "ip_logs"), where("userId", "==", userId))
        );

        if (cancelled) return;

        setRegistrationIp(userData?.registrationIp || "");
        setLastLoginIp(userData?.lastLoginIp || "");

        const sortByDateDesc = <T extends { createdAt: Date | null }>(arr: T[]) =>
          arr.sort(
            (a, b) =>
              (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
          );

        setOffers(
          sortByDateDesc(
            txSnap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                offerName: data.offerName || "Unknown Offer",
                offerwall: data.offerwallName || data.offerwall || "Unknown",
                points: data.points || 0,
                amountUSD: data.amountUSD || 0,
                userIp: data.userIp || "",
                country: data.country || "",
                status: data.status || "completed",
                createdAt: data.createdAt?.toDate?.() || null,
              };
            })
          )
        );

        setIpLogs(
          sortByDateDesc(
            ipSnap.docs.map((d) => {
              const data = d.data();
              return {
                ip: data.ip || "",
                event: data.event || "login",
                country: data.country || "",
                createdAt: data.createdAt?.toDate?.() || null,
              };
            })
          )
        );
      } catch (err) {
        console.error("[v0] Fraud review load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  // Build the set of IPs the user authenticated from.
  const knownIps = new Set<string>(
    [registrationIp, lastLoginIp, ...ipLogs.map((l) => l.ip)].filter(Boolean)
  );

  const offerIps = new Set(offers.map((o) => o.userIp).filter(Boolean));
  const mismatchedOffers = offers.filter(
    (o) => o.userIp && !knownIps.has(o.userIp)
  );
  const uniqueOfferIpCount = offerIps.size;

  const ipMatches = (ip: string) => !!ip && knownIps.has(ip);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white rounded-2xl max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Fraud Review — {username}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Compare the IPs used to complete offers against the IPs used to log in.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="p-5 space-y-5">
              {/* Auth IP summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Fingerprint className="h-3.5 w-3.5" />
                    Registration IP
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {registrationIp || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Globe className="h-3.5 w-3.5" />
                    Last Login IP
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {lastLoginIp || "—"}
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    mismatchedOffers.length > 0
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Distinct Offer IPs
                  </div>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      mismatchedOffers.length > 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {uniqueOfferIpCount} IP{uniqueOfferIpCount === 1 ? "" : "s"} ·{" "}
                    {mismatchedOffers.length} mismatch
                    {mismatchedOffers.length === 1 ? "" : "es"}
                  </p>
                </div>
              </div>

              {/* Verdict banner */}
              {mismatchedOffers.length > 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-sm text-red-200">
                    <span className="font-bold">Potential VPN/multi-account abuse.</span>{" "}
                    {mismatchedOffers.length} offer
                    {mismatchedOffers.length === 1 ? "" : "s"} were completed from an
                    IP that does not match any of this user&apos;s known
                    login/registration IPs.
                  </p>
                </div>
              ) : offers.length > 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm text-emerald-200">
                    All offer IPs match this user&apos;s known login/registration
                    IPs.
                  </p>
                </div>
              ) : null}

              {/* Offer log table */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Offer</TableHead>
                      <TableHead className="text-white/60">Provider</TableHead>
                      <TableHead className="text-white/60">Points</TableHead>
                      <TableHead className="text-white/60">IP Used</TableHead>
                      <TableHead className="text-white/60">Match</TableHead>
                      <TableHead className="text-white/60">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={6}
                          className="text-center text-white/40 py-8"
                        >
                          No completed offers found for this user.
                        </TableCell>
                      </TableRow>
                    ) : (
                      offers.map((offer) => {
                        const match = ipMatches(offer.userIp);
                        return (
                          <TableRow
                            key={offer.id}
                            className="border-white/10 hover:bg-white/[0.02]"
                          >
                            <TableCell className="max-w-[180px] truncate text-white">
                              {offer.offerName}
                            </TableCell>
                            <TableCell className="text-white/70">
                              {offer.offerwall}
                            </TableCell>
                            <TableCell className="text-white/70">
                              {offer.points.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-white/70">
                              {offer.userIp || "—"}
                              {offer.country ? (
                                <span className="ml-1 text-white/40">
                                  ({offer.country})
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              {!offer.userIp ? (
                                <Badge className="bg-white/5 text-white/40 border border-white/10 rounded-lg">
                                  No IP
                                </Badge>
                              ) : match ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                                  Match
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
                                  Mismatch
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-white/50 text-xs whitespace-nowrap">
                              {offer.createdAt
                                ? offer.createdAt.toLocaleDateString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Login/IP history */}
              {ipLogs.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-bold text-white/70">
                    Login / Registration IP History
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ipLogs.map((log, i) => (
                      <Badge
                        key={i}
                        className="bg-white/5 text-white/70 border border-white/10 rounded-lg font-mono text-xs"
                      >
                        {log.event}: {log.ip}
                        {log.country ? ` · ${log.country}` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
