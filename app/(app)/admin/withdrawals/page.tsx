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
  getDocs,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import Link from "next/link";

interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  pointsDeducted: number;
  method: string;
  paymentDetails: string;
  status: "pending" | "completed" | "rejected";
  createdAt: Date;
  processedAt?: Date;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
            amount: d.amount,
            pointsDeducted: d.pointsDeducted,
            method: d.method,
            paymentDetails: d.paymentDetails,
            status: d.status,
            createdAt: d.createdAt?.toDate() || new Date(),
            processedAt: d.processedAt?.toDate(),
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

  const pendingCount = pendingWithdrawals.length;
  const pendingTotal = pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-0">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-[var(--brand-cyan)]" />
              Withdrawals
            </h1>
            <p className="text-muted-foreground">
              Process withdrawal requests
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                onClick={approveSelected}
                disabled={markingAll}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
              className="brand-gradient text-primary-foreground"
            >
              {markingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Approve All ({pendingCount})
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
           <p className="text-2xl font-bold text-[var(--brand-purple)]">
  ${(pendingTotal || 0).toFixed(2)}
</p>
            <p className="text-sm text-muted-foreground">Pending Amount</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {withdrawals.filter((w) => w.status === "completed").length}
            </p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Withdrawals</CardTitle>
              <CardDescription>
                {withdrawals.length} total withdrawal requests
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === pendingWithdrawals.length && pendingWithdrawals.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">Select All Pending</span>
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
                  className="flex items-center justify-between rounded-lg bg-secondary p-4 animate-pulse"
                >
                  <div className="h-5 w-40 bg-muted rounded" />
                  <div className="h-5 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No withdrawal requests yet
            </p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className={`rounded-lg border p-4 ${
                    withdrawal.status === "pending"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-secondary"
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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            ${withdrawal.amount.toFixed(2)}
                          </span>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <p className="text-sm font-medium">{withdrawal.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {withdrawal.method}: {withdrawal.paymentDetails}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {withdrawal.createdAt.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Points deducted: {withdrawal.pointsDeducted?.toLocaleString() || 0}
                        </p>
                      </div>
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
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
                          className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
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
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
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
    </div>
  );
}
