"use client";

import { useState } from "react";
import { Search, MoreHorizontal, Ban, Eye, Coins, Settings } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock users data
const mockUsers = [
  {
    id: "1",
    name: "john_doe",
    email: "john@example.com",
    avatar: "avatar-1",
    totalEarnings: 156420,
    balance: 5420,
    referrals: 12,
    status: "active",
    joinedDate: "2026-01-15",
  },
  {
    id: "2",
    name: "sarah_smith",
    email: "sarah@example.com",
    avatar: "avatar-2",
    totalEarnings: 89500,
    balance: 2500,
    referrals: 5,
    status: "active",
    joinedDate: "2026-01-20",
  },
  {
    id: "3",
    name: "mike_jones",
    email: "mike@example.com",
    avatar: "avatar-3",
    totalEarnings: 45200,
    balance: 0,
    referrals: 3,
    status: "active",
    joinedDate: "2026-02-01",
  },
  {
    id: "4",
    name: "emma_wilson",
    email: "emma@example.com",
    avatar: "avatar-4",
    totalEarnings: 23100,
    balance: 1100,
    referrals: 8,
    status: "banned",
    joinedDate: "2026-02-05",
  },
  {
    id: "5",
    name: "alex_brown",
    email: "alex@example.com",
    avatar: "avatar-5",
    totalEarnings: 67800,
    balance: 3800,
    referrals: 15,
    status: "active",
    joinedDate: "2026-02-10",
  },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage all users on the platform
        </p>
      </div>

      {/* Search */}
      <Card className="border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-input pl-9"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">USER</TableHead>
              <TableHead className="text-muted-foreground">
                TOTAL EARNINGS
              </TableHead>
              <TableHead className="text-muted-foreground">BALANCE</TableHead>
              <TableHead className="text-muted-foreground">REFERRALS</TableHead>
              <TableHead className="text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-muted-foreground">JOINED</TableHead>
              <TableHead className="text-right text-muted-foreground">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-100">
                      <span className="font-bold text-pink-800">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">
                      {user.totalEarnings.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>{user.balance.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>{user.referrals}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.joinedDate}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Adjust Balance
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Ban className="mr-2 h-4 w-4" />
                        {user.status === "banned" ? "Unban User" : "Ban User"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
