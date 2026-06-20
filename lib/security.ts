import { NextRequest } from "next/server";

/**
 * Strict alphanumeric (English) validation.
 * Rejects Arabic characters, spaces, and special characters to prevent exploitation.
 */
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

export function isStrictAlphanumeric(value: string): boolean {
  return typeof value === "string" && ALPHANUMERIC_REGEX.test(value);
}

/**
 * Password policy: English letters, numbers, and a curated set of safe symbols only.
 * Minimum 6 characters.
 */
export const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=]{6,}$/;

export function isValidPassword(value: string): boolean {
  return typeof value === "string" && PASSWORD_REGEX.test(value);
}

export function isValidEmail(value: string): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Best-effort client IP extraction behind Vercel's proxy chain.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
