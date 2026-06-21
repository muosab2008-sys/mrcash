import { verify } from "otplib"

/**
 * Verifies a TOTP code against a Base32 secret.
 *
 * otplib v13's `verify()` is ASYNC and resolves to `{ valid, delta }` — it does
 * NOT return a boolean. The previous code called it synchronously and treated
 * the returned Promise as truthy, which broke verification. This helper awaits
 * the result, reads `.valid`, and adds a ±1 time-step (30s) tolerance so small
 * clock drift between the server and the authenticator app does not reject
 * otherwise-valid codes.
 */
export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  if (!secret || !token) return false

  // Authenticator apps and users sometimes include spaces; normalize first.
  const normalized = token.replace(/\s+/g, "").trim()
  if (!/^\d{6}$/.test(normalized)) return false

  try {
    const result = await verify({
      secret,
      token: normalized,
      // Allow the previous and next 30s window to absorb clock drift.
      epochTolerance: 30,
    })
    return result.valid === true
  } catch (err) {
    console.error("[v0] verifyTotpCode error:", err)
    return false
  }
}
