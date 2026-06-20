import { randomBytes } from "crypto";

/**
 * Strict identifier pattern: English letters and digits only.
 * Rejects Arabic characters, spaces, and special characters.
 */
export const STRICT_ALNUM = /^[A-Za-z0-9]+$/;

/**
 * Password pattern: English letters, digits and a constrained set of common
 * symbols. Rejects non-ASCII (e.g. Arabic) characters.
 */
export const STRICT_PASSWORD = /^[A-Za-z0-9!@#$%^&*()_\-+=]{6,}$/;

export function isStrictAlnum(value: unknown): value is string {
  return typeof value === "string" && STRICT_ALNUM.test(value);
}

export function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && STRICT_PASSWORD.test(value);
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Generates a cryptographically secure URL-safe token. */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** Best-effort client IP extraction from forwarded headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
