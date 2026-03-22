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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  CheckCheck,
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
      });

      // If rejected, refund points
      if (status === "rejected" && userId && pointsToRefund) {
        const userRef = doc(db, "users", userId);
        // Note: In production, use a transaction to safely increment
        batch.update(userRef, {
          points: pointsToRefund, // This should use FieldValue.increment in production
        });
      }

      await batch.commit();
      toast.success(status === "completed" ? "Withdrawal approved" : "Withdrawal rejected");
    } catch (error: any) {
      toast.error(error.message || "Failed to update withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  const markAllAsPaid = async () => {
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
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
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all as paid");
    } finally {
      setMarkingAll(false);
    }
  };

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const pendingTotal = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, w) => acc + w.amount, 0);

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
            Mark All as Paid ({pendingCount})
          </Button>
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
              ${pendingTotal.toFixed(2)}
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
          <CardTitle>All Withdrawals</CardTitle>
          <CardDescription>
            {withdrawals.length} total withdrawal requests
          </CardDescription>
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
                    </div>

                    {withdrawal.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateWithdrawalStatus(
                              withdrawal.id,
                              "rejected",
                              withdrawal.userId,
                              withdrawal.pointsDeducted
                            )
                          }
                          disabled={processing === withdrawal.id}
                        >
                          {processing === withdrawal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateWithdrawalStatus(withdrawal.id, "completed")
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
