/**
 * TOTP Guard — in-memory protection against:
 *  1. Replay attacks: a validated token cannot be reused within its validity window
 *  2. Brute-force attacks: after MAX_FAILURES consecutive wrong codes the user is
 *     locked out for LOCKOUT_MS milliseconds
 *
 * The store is process-local (good enough for single-process deployments).
 * For multi-instance deployments, replace with a shared Redis store.
 */

const TOTP_PERIOD_MS = 30_000; // 30 s — must match TOTP period
const REPLAY_WINDOW_PERIODS = 3; // keep tokens for current ± 1 windows → 90 s
const REPLAY_TTL_MS = TOTP_PERIOD_MS * REPLAY_WINDOW_PERIODS;

const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// ── Replay prevention ──────────────────────────────────────────────────────

// Map<userId, Map<token, expiresAt>>
const usedTokens = new Map<string, Map<string, number>>();

function pruneExpiredTokens(userTokens: Map<string, number>): void {
  const now = Date.now();
  for (const [token, expiresAt] of userTokens) {
    if (now > expiresAt) userTokens.delete(token);
  }
}

/**
 * Returns true if the token was already used by this user recently.
 */
export function isTokenReplayed(userId: string, token: string): boolean {
  const userTokens = usedTokens.get(userId);
  if (!userTokens) return false;
  pruneExpiredTokens(userTokens);
  return userTokens.has(token);
}

/**
 * Mark a token as used so subsequent calls to isTokenReplayed return true.
 */
export function markTokenUsed(userId: string, token: string): void {
  let userTokens = usedTokens.get(userId);
  if (!userTokens) {
    userTokens = new Map();
    usedTokens.set(userId, userTokens);
  }
  pruneExpiredTokens(userTokens);
  userTokens.set(token, Date.now() + REPLAY_TTL_MS);
}

// ── Brute-force lockout ────────────────────────────────────────────────────

interface FailureRecord {
  count: number;
  lockedUntil: number | null;
}

// Map<userId, FailureRecord>
const failureRecords = new Map<string, FailureRecord>();

/**
 * Returns a lockout expiry timestamp (ms) if the user is currently locked out,
 * or null if they may proceed.
 */
export function getLockoutExpiry(userId: string): number | null {
  const record = failureRecords.get(userId);
  if (!record?.lockedUntil) return null;
  if (Date.now() < record.lockedUntil) return record.lockedUntil;
  // Lockout expired — reset
  failureRecords.delete(userId);
  return null;
}

/**
 * Record a failed TOTP attempt.  Returns the updated failure count.
 * Automatically triggers lockout after MAX_FAILURES failures.
 */
export function recordFailure(userId: string): number {
  const record = failureRecords.get(userId) ?? { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_FAILURES) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  failureRecords.set(userId, record);
  return record.count;
}

/**
 * Clear failure history after a successful verification.
 */
export function clearFailures(userId: string): void {
  failureRecords.delete(userId);
}
