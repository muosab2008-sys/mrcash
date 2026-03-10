"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  Percent,
  BarChart3,
  Clock,
  Copy,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Send,
  Coins,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Mock user data
const mockAffiliateData = {
  name: "mm",
  avatar: "avatar-1",
  joinedDate: "Jan 21, 2026",
  country: "US",
  todayEarnings: 0,
  commission: 5,
  totalEarnings: 0,
  usersReferred: 0,
  earningsLast30Days: 0,
  referralCode: "6QN9eqAZ",
};

const socialButtons = [
  { icon: Mail, label: "Email", color: "#6366f1" },
  { icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
  { icon: Twitter, label: "Twitter", color: "#1DA1F2" },
  { icon: Facebook, label: "Facebook", color: "#4267B2" },
  { icon: Send, label: "Telegram", color: "#0088cc" },
];

export default function AffiliatesPage() {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://mrcash.app/ref/${mockAffiliateData.referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Affiliates</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info Card */}
        <Card className="border-border bg-card p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-100 ring-4 ring-primary/20">
                <span className="text-3xl font-bold text-pink-800">
                  {mockAffiliateData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {mockAffiliateData.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Joined: {mockAffiliateData.joinedDate}
                  </p>
                </div>
                <span className="text-2xl">🇺🇸</span>
              </div>

              {/* Affiliate Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Today Earnings
                    </p>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-foreground">
                        {mockAffiliateData.todayEarnings}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <span className="font-bold text-foreground">
                      %{mockAffiliateData.commission}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        <Card className="border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Statistics</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-xl font-bold text-foreground">
                    {mockAffiliateData.totalEarnings}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users Referred</p>
                <span className="text-xl font-bold text-foreground">
                  {mockAffiliateData.usersReferred}
                </span>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Earnings last 30 days
                </p>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-xl font-bold text-foreground">
                    {mockAffiliateData.earningsLast30Days}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="border-border bg-card p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left - Referral Link */}
          <div>
            <h3 className="mb-2 font-bold text-foreground">Your referral link</h3>
            <div className="flex items-center gap-3">
              <code className="rounded-lg bg-muted px-4 py-2 font-mono text-sm text-foreground">
                {referralLink}
              </code>
              <Button
                variant="outline"
                className="gap-2 border-primary text-primary hover:bg-primary/10"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Invite friends and earn rewards! Friends you refer will receive a{" "}
              <span className="font-bold text-foreground">0-points bonus</span>{" "}
              upon signing up.
            </p>
          </div>

          {/* Right - Social Sharing */}
          <div>
            <h3 className="mb-2 font-bold text-foreground">
              Invite friends and earn rewards!
            </h3>
            <div className="flex gap-2">
              {socialButtons.map(({ icon: Icon, label, color }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border hover:border-primary/50"
                  style={{ color }}
                  title={label}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
