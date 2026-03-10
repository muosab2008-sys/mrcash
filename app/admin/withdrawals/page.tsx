"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock withdrawals data
const mockWithdrawals = [
  {
    id: "1",
    user: "john_doe",
    method: "PayPal",
    address: "john@example.com",
    points: 5000,
    status: "pending",
    createdAt: "2026-02-10 14:30",
  },
  {
    id: "2",
    user: "sarah_smith",
    method: "Bitcoin",
    address: "1BvBMSEY...",
    points: 10000,
    status: "pending",
    createdAt: "2026-02-10 13:45",
  },
  {
    id: "3",
    user: "mike_jones",
    method: "cWallet",
    address: "66520476",
    points: 2500,
    status: "approved",
    createdAt: "2026-02-10 12:00",
  },
  {
    id: "4",
    user: "emma_wilson",
    method: "Binance",
    address: "emma_binance",
    points: 7500,
    status: "rejected",
    createdAt: "2026-02-09 18:20",
  },
  {
    id: "5",
    user: "alex_brown",
    method: "PayPal",
    address: "alex@example.com",
    points: 3000,
    status: "approved",
    createdAt: "2026-02-09 15:10",
  },
];

export default function AdminWithdrawalsPage() {
  const [search, setSearch] = useState("");

  const getFilteredWithdrawals = (status: string) => {
    return mockWithdrawals.filter((w) => {
      const matchesSearch =
        w.user.toLowerCase().includes(search.toLowerCase()) ||
        w.method.toLowerCase().includes(search.toLowerCase());
      
      if (status === "all") return matchesSearch;
      return matchesSearch && w.status === status;
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: { icon: Clock, className: "bg-yellow-500/10 text-yellow-500" },
      approved: { icon: CheckCircle, className: "bg-primary/10 text-primary" },
      rejected: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
    };
    const { icon: Icon, className } = config[status as keyof typeof config];
    return (
      <Badge className={className}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const WithdrawalsTable = ({ withdrawals }: { withdrawals: typeof mockWithdrawals }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">USER</TableHead>
          <TableHead className="text-muted-foreground">METHOD</TableHead>
          <TableHead className="text-muted-foreground">ADDRESS</TableHead>
          <TableHead className="text-muted-foreground">POINTS</TableHead>
          <TableHead className="text-muted-foreground">STATUS</TableHead>
          <TableHead className="text-muted-foreground">DATE</TableHead>
          <TableHead className="text-right text-muted-foreground">
            ACTIONS
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {withdrawals.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="py-8 text-center text-muted-foreground"
            >
              No withdrawals found
            </TableCell>
          </TableRow>
        ) : (
          withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal.id} className="border-border">
              <TableCell>
                <span className="font-medium text-foreground">
                  {withdrawal.user}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                    <span className="text-xs font-bold text-primary">
                      {withdrawal.method.charAt(0)}
                    </span>
                  </div>
                  <span>{withdrawal.method}</span>
                </div>
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1 text-xs">
                  {withdrawal.address}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">
                    {withdrawal.points.toLocaleString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={withdrawal.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {withdrawal.createdAt}
              </TableCell>
              <TableCell className="text-right">
                {withdrawal.status === "pending" && (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="text-primary">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Withdrawals</h1>
        <p className="text-sm text-muted-foreground">
          Manage withdrawal requests from users
        </p>
      </div>

      {/* Search */}
      <Card className="border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user or method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-input pl-9"
          />
        </div>
      </Card>

      {/* Tabs */}
      <Card className="border-border bg-card">
        <Tabs defaultValue="pending">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="pending"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pending ({getFilteredWithdrawals("pending").length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved ({getFilteredWithdrawals("approved").length})
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejected ({getFilteredWithdrawals("rejected").length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              All ({getFilteredWithdrawals("all").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <WithdrawalsTable withdrawals={getFilteredWithdrawals("pending")} />
          </TabsContent>
          <TabsContent value="approved">
            <WithdrawalsTable withdrawals={getFilteredWithdrawals("approved")} />
          </TabsContent>
          <TabsContent value="rejected">
            <WithdrawalsTable withdrawals={getFilteredWithdrawals("rejected")} />
          </TabsContent>
          <TabsContent value="all">
            <WithdrawalsTable withdrawals={getFilteredWithdrawals("all")} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
