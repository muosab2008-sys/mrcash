import type { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  country: string;
  createdAt: Timestamp;
  totalEarnings: number;
  availableBalance: number;
  completedOffers: number;
  referredUsers: number;
  referralCode: string;
  referredBy?: string;
  isPrivate: boolean;
  notificationsEnabled: boolean;
}

export interface Offer {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  description: string;
  image: string;
  points: number;
  platforms: ("android" | "ios" | "desktop")[];
  instructions: string;
  trackingUrl: string;
  completions: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  rating: number;
  badge?: string;
  badgeColor?: string;
  featured: boolean;
  bannerImage?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  postbackUrl?: string;
  isActive: boolean;
}

export interface Earning {
  id: string;
  userId: string;
  offerId: string;
  offerName: string;
  partnerId: string;
  partnerName: string;
  points: number;
  timestamp: Timestamp;
  status: "pending" | "approved" | "rejected";
}

export interface Withdrawal {
  id: string;
  userId: string;
  method: string;
  methodType: "crypto" | "cashout" | "giftcard" | "skins";
  points: number;
  address: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  processedAt?: Timestamp;
}

export interface CashoutMethod {
  id: string;
  name: string;
  logo: string;
  type: "crypto" | "cashout" | "giftcard" | "skins";
  minPoints: number;
  conversionRate: number;
  isActive: boolean;
  borderColor?: string;
}

export interface Settings {
  siteName: string;
  referralBonus: number;
  referralCommission: number;
  adminEmails: string[];
}

export interface TopEarner {
  id: string;
  name: string;
  avatar: string;
  partnerName: string;
  points: number;
}
