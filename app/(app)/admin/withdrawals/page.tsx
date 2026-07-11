"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  where,
  serverTimestamp,
  increment,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  CheckCheck,
  RotateCcw,
  Ban,
  Globe,
  Gift,
  ShieldAlert,
  Search,
  Mail,
  User as UserIcon,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  email: string;
  amountUSD: number;
  pointsDeducted: number;
  method: string;
  paymentDetails: string;
  status: "pending" | "completed" | "rejected";
  createdAt: Date;
  processedAt?: Date;
  ipAddress?: string | null;
  lastOfferName?: string | null;
  lastOfferwall?: string | null;
}

interface OfferHistoryItem {
  id: string;
  offerName: string;
  company: string;
  points: number;
  ipAddress: string;
  createdAt: Date | null;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Security detail dialog state
  const [detailWithdrawal, setDetailWithdrawal] = useState<Withdrawal | null>(null);
  const [detailUser, setDetailUser] = useState<{ username?: string; email?: string } | null>(null);
  const [userOffers, setUserOffers] = useState<OfferHistoryItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const openSecurityDetails = async (withdrawal: Withdrawal) => {
    setDetailWithdrawal(withdrawal);
    setDetailUser(null);
    setUserOffers([]);
    setLoadingDetails(true);
    try {
      // Fetch fresh user profile (username + email)
      let profile: { username?: string; email?: string } = {
        username: withdrawal.username,
        email: withdrawal.email,
      };
      try {
        const userSnap = await getDoc(doc(db, "users", withdrawal.userId));
        if (userSnap.exists()) {
          const u = userSnap.data();
          profile = { username: u.username || withdrawal.username, email: u.email || withdrawal.email };
        }
      } catch (err) {
        console.log("[v0] withdrawal details: user lookup failed", err);
      }
      setDetailUser(profile);

      // Fetch every offer this user completed, with the IP used for each
      const offersSnap = await getDocs(
        query(collection(db, "offers_history"), where("userId", "==", withdrawal.userId))
      );
      const offers = offersSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          offerName: data.offerName || "Offer",
          company: data.company || "—",
          points: data.points || 0,
          ipAddress: data.ipAddress || "unknown",
          createdAt: data.createdAt?.toDate?.() || data.timestamp?.toDate?.() || null,
        } as OfferHistoryItem;
      });
      // Sort newest first on the client (avoids requiring a composite index)
      offers.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      setUserOffers(offers);
    } catch (err: any) {
      toast.error("Failed to load user security details");
      console.error("[v0] openSecurityDetails error:", err?.message || err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            userId: d.userId,
            username: d.username,
            email: d.email,
            amountUSD: d.amountUSD || 0,
            pointsDeducted: d.pointsDeducted || 0,
            method: d.method,
            paymentDetails: d.paymentDetails,
            status: d.status,
            createdAt: d.createdAt?.toDate() || new Date(),
            processedAt: d.processedAt?.toDate(),
            ipAddress: d.ipAddress || null,
            lastOfferName: d.lastOfferName || null,
            lastOfferwall: d.lastOfferwall || null,
          };
        }) as Withdrawal[];
        setWithdrawals(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const updateWithdrawalStatus = async (
    id: string,
    status: "completed" | "rejected",
    refundPoints: boolean = false,
    userId?: string,
    pointsToRefund?: number
  ) => {
    setProcessing(id);
    try {
      const batch = writeBatch(db);

      // Update withdrawal status
      const withdrawalRef = doc(db, "withdrawals", id);
      batch.update(withdrawalRef, {
        status,
        processedAt: serverTimestamp(),
        refunded: refundPoints,
      });

      // If rejected with refund, return points to user
      if (status === "rejected" && refundPoints && userId && pointsToRefund) {
        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
          points: increment(pointsToRefund),
        });
      }

      await batch.commit();
      
      if (status === "completed") {
        toast.success("Withdrawal approved");
      } else if (refundPoints) {
        toast.success("Withdrawal rejected - Points refunded");
      } else {
        toast.success("Withdrawal rejected - No refund");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  // Selection handlers
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const completedWithdrawals = withdrawals.filter((w) => w.status === "completed");
  
  // Calculate total paid to users (completed withdrawals)
  const totalPaidUSD = completedWithdrawals.reduce((acc, w) => acc + (w.amountUSD || 0), 0);
  const pendingAmountUSD = pendingWithdrawals.reduce((acc, w) => acc + (w.amountUSD || 0), 0);
  
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === pendingWithdrawals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingWithdrawals.map((w) => w.id)));
    }
  };

  const approveSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("No withdrawals selected");
      return;
    }

    setMarkingAll(true);
    try {
      const batch = writeBatch(db);

      for (const id of selectedIds) {
        const ref = doc(db, "withdrawals", id);
        batch.update(ref, {
          status: "completed",
          processedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      toast.success(`Approved ${selectedIds.size} withdrawals`);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to approve selected");
    } finally {
      setMarkingAll(false);
    }
  };

  const markAllAsPaid = async () => {
    if (pendingWithdrawals.length === 0) {
      toast.info("No pending withdrawals");
      return;
    }

    setMarkingAll(true);
    try {
      const batch = writeBatch(db);

      for (const withdrawal of pendingWithdrawals) {
        const ref = doc(db, "withdrawals", withdrawal.id);
        batch.update(ref, {
          status: "completed",
          processedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      toast.success(`Marked ${pendingWithdrawals.length} withdrawals as paid`);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all as paid");
    } finally {
      setMarkingAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <DollarSign className="h-6 w-6 text-[#3B82F6]" />
              Withdrawals
            </h1>
            <p className="text-white/50">
              Process withdrawal requests
            </p>
          </div>
        </div>
        {pendingWithdrawals.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <Button
                onClick={approveSelected}
                disabled={markingAll}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              >
                {markingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve Selected ({selectedIds.size})
              </Button>
            )}
            <Button
              onClick={markAllAsPaid}
              disabled={markingAll}
              className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl"
            >
              {markingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Approve All ({pendingWithdrawals.length})
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-black text-amber-500">{pendingWithdrawals.length}</p>
            <p className="text-sm text-white/50">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-black text-[#8B5CF6]">${pendingAmountUSD.toFixed(2)}</p>
            <p className="text-sm text-white/50">Pending Amount</p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-black text-emerald-500">${totalPaidUSD.toFixed(2)}</p>
            <p className="text-sm text-white/50">Total Paid to Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals List */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-white">All Withdrawals</CardTitle>
              <CardDescription className="text-white/40">
                {withdrawals.length} total withdrawal requests
              </CardDescription>
            </div>
            {pendingWithdrawals.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === pendingWithdrawals.length && pendingWithdrawals.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-white/50">Select All Pending</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-white/5 p-5 animate-pulse"
                >
                  <div className="h-5 w-40 bg-white/10 rounded-lg" />
                  <div className="h-5 w-20 bg-white/10 rounded-lg" />
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="py-8 text-center text-white/40">
              No withdrawal requests yet
            </p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className={`rounded-2xl border p-5 ${
                    withdrawal.status === "pending"
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      {withdrawal.status === "pending" && (
                        <Checkbox
                          checked={selectedIds.has(withdrawal.id)}
                          onCheckedChange={() => toggleSelection(withdrawal.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xl text-white">
                            ${(withdrawal.amountUSD || 0).toFixed(2)}
                          </span>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <p className="text-sm font-medium text-white">{withdrawal.username}</p>
                        <p className="text-xs text-white/40">
                          {withdrawal.method}: {withdrawal.paymentDetails}
                        </p>
                        <p className="text-xs text-white/40">
                          {withdrawal.createdAt.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40">
                          Points deducted: {withdrawal.pointsDeducted?.toLocaleString() || 0}
                        </p>

                        {/* Anti-cheat: IP + last completed offer */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <span className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-xs font-medium text-red-400">
                            <Globe className="h-3.5 w-3.5" />
                            IP: <span className="font-mono">{withdrawal.ipAddress || "unknown"}</span>
                          </span>
                          {(withdrawal.lastOfferName || withdrawal.lastOfferwall) && (
                            <span className="flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 px-2.5 py-1 text-xs font-medium text-[#a78bfa]">
                              <Gift className="h-3.5 w-3.5" />
                              Last offer: {withdrawal.lastOfferName || "—"}
                              {withdrawal.lastOfferwall ? ` (${withdrawal.lastOfferwall})` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Security Details Button (always available) */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSecurityDetails(withdrawal)}
                        className="text-[#3B82F6] border-[#3B82F6]/30 hover:bg-[#3B82F6]/10 rounded-xl"
                      >
                        <ShieldAlert className="mr-1 h-4 w-4" />
                        Security Details
                      </Button>
                    </div>

                    {withdrawal.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        {/* Approve Button */}
                        <Button
                          size="sm"
                          onClick={() =>
                            updateWithdrawalStatus(withdrawal.id, "completed", false)
                          }
                          disabled={processing === withdrawal.id}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                        >
                          {processing === withdrawal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        
                        {/* Reject & Refund Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateWithdrawalStatus(
                              withdrawal.id,
                              "rejected",
                              true,
                              withdrawal.userId,
                              withdrawal.pointsDeducted
                            )
                          }
                          disabled={processing === withdrawal.id}
                          className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10 rounded-xl"
                        >
                          {processing === withdrawal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="mr-1 h-4 w-4" />
                              Reject & Refund
                            </>
                          )}
                        </Button>
                        
                        {/* Reject No Refund Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateWithdrawalStatus(
                              withdrawal.id,
                              "rejected",
                              false
                            )
                          }
                          disabled={processing === withdrawal.id}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-xl"
                        >
                          {processing === withdrawal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Ban className="mr-1 h-4 w-4" />
                              Reject (No Refund)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Details Dialog */}
      <Dialog open={!!detailWithdrawal} onOpenChange={(open) => !open && setDetailWithdrawal(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-[#0a0a0a] text-white rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ShieldAlert className="h-5 w-5 text-[#3B82F6]" />
              User Security Report
            </DialogTitle>
          </DialogHeader>

          {detailWithdrawal && (
            <div className="space-y-5">
              {/* User identity */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="flex items-center gap-2 text-xs text-white/40">
                    <UserIcon className="h-3.5 w-3.5" /> Username
                  </p>
                  <p className="mt-1 font-bold break-all">{detailUser?.username || detailWithdrawal.username || "—"}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="flex items-center gap-2 text-xs text-white/40">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </p>
                  <p className="mt-1 font-bold break-all">{detailUser?.email || detailWithdrawal.email || "—"}</p>
                </div>
              </div>

              {/* Withdrawal IP highlighted for VPN comparison */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-red-400">
                  <Globe className="h-3.5 w-3.5" /> Withdrawal Request IP
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-red-300">
                  {detailWithdrawal.ipAddress || "unknown"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Compare this with each offer&apos;s IP below. Rows with a different IP are highlighted as possible VPN / multi-account activity.
                </p>
              </div>

              {/* Offers history table */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                  <Gift className="h-4 w-4 text-[#8B5CF6]" />
                  Offers Completed ({userOffers.length})
                </p>

                {loadingDetails ? (
                  <div className="flex items-center justify-center py-10 text-white/40">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading offers history...
                  </div>
                ) : userOffers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-white/40">
                    <Search className="h-6 w-6" />
                    <p>No recorded offers for this user yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/40">
                          <th className="px-3 py-2.5">Offer</th>
                          <th className="px-3 py-2.5">Company</th>
                          <th className="px-3 py-2.5 text-right">Points</th>
                          <th className="px-3 py-2.5">Offer IP</th>
                          <th className="px-3 py-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userOffers.map((offer) => {
                          const withdrawalIp = detailWithdrawal.ipAddress || "";
                          const ipMismatch =
                            withdrawalIp &&
                            withdrawalIp !== "unknown" &&
                            offer.ipAddress !== "unknown" &&
                            offer.ipAddress !== withdrawalIp;
                          return (
                            <tr
                              key={offer.id}
                              className={`border-b border-white/5 last:border-0 ${
                                ipMismatch ? "bg-amber-500/5" : ""
                              }`}
                            >
                              <td className="px-3 py-2.5 font-medium text-white/90">{offer.offerName}</td>
                              <td className="px-3 py-2.5 text-white/60">{offer.company}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                                +{offer.points.toLocaleString()}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-flex items-center gap-1 font-mono text-xs ${
                                    ipMismatch ? "text-amber-400" : "text-white/70"
                                  }`}
                                >
                                  {ipMismatch && <AlertTriangle className="h-3 w-3" />}
                                  {offer.ipAddress}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-white/50">
                                {offer.createdAt ? offer.createdAt.toLocaleString() : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
