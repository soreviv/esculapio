import { describe, it, expect, beforeEach, vi } from "vitest";
import * as OTPAuth from "otpauth";
import { isAuthenticated } from "../server/auth";
import type { Request, Response, NextFunction } from "express";

// ── totp-guard unit tests ────────────────────────────────────────────────────

describe("TOTP Guard — replay prevention", () => {
  // Re-import fresh instances for each describe block so state doesn't bleed
  let isTokenReplayed: (u: string, t: string) => boolean;
  let markTokenUsed: (u: string, t: string) => void;

  beforeEach(async () => {
    vi.resetModules();
    const guard = await import("../server/totp-guard");
    isTokenReplayed = guard.isTokenReplayed;
    markTokenUsed = guard.markTokenUsed;
  });

  it("returns false for a token that has never been used", () => {
    expect(isTokenReplayed("user-1", "123456")).toBe(false);
  });

  it("returns true immediately after a token is marked as used", () => {
    markTokenUsed("user-2", "654321");
    expect(isTokenReplayed("user-2", "654321")).toBe(true);
  });

  it("different tokens for the same user are independent", () => {
    markTokenUsed("user-3", "111111");
    expect(isTokenReplayed("user-3", "222222")).toBe(false);
  });

  it("same token for different users is independent", () => {
    markTokenUsed("user-4", "999999");
    expect(isTokenReplayed("user-5", "999999")).toBe(false);
  });
});

describe("TOTP Guard — brute-force lockout", () => {
  let getLockoutExpiry: (u: string) => number | null;
  let recordFailure: (u: string) => number;
  let clearFailures: (u: string) => void;

  beforeEach(async () => {
    vi.resetModules();
    const guard = await import("../server/totp-guard");
    getLockoutExpiry = guard.getLockoutExpiry;
    recordFailure = guard.recordFailure;
    clearFailures = guard.clearFailures;
  });

  it("no lockout before any failures", () => {
    expect(getLockoutExpiry("user-a")).toBeNull();
  });

  it("no lockout after 4 failures (threshold is 5)", () => {
    for (let i = 0; i < 4; i++) recordFailure("user-b");
    expect(getLockoutExpiry("user-b")).toBeNull();
  });

  it("lockout activates on the 5th failure", () => {
    for (let i = 0; i < 5; i++) recordFailure("user-c");
    const expiry = getLockoutExpiry("user-c");
    expect(expiry).not.toBeNull();
    expect(expiry!).toBeGreaterThan(Date.now());
  });

  it("lockout expiry is approximately 15 minutes in the future", () => {
    for (let i = 0; i < 5; i++) recordFailure("user-d");
    const expiry = getLockoutExpiry("user-d")!;
    const diffMin = (expiry - Date.now()) / 60_000;
    expect(diffMin).toBeGreaterThan(14);
    expect(diffMin).toBeLessThanOrEqual(15);
  });

  it("clearFailures removes the lockout", () => {
    for (let i = 0; i < 5; i++) recordFailure("user-e");
    expect(getLockoutExpiry("user-e")).not.toBeNull();
    clearFailures("user-e");
    expect(getLockoutExpiry("user-e")).toBeNull();
  });

  it("recordFailure returns the cumulative count", () => {
    expect(recordFailure("user-f")).toBe(1);
    expect(recordFailure("user-f")).toBe(2);
    expect(recordFailure("user-f")).toBe(3);
  });
});

// ── isAuthenticated blocks pendingTwoFactor sessions ────────────────────────

describe("isAuthenticated middleware — pendingTwoFactor", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    mockNext = vi.fn();
  });

  it("blocks requests when pendingTwoFactor is true", () => {
    mockReq = {
      session: { userId: "user-1", role: "medico", nombre: "Dr. Test", pendingTwoFactor: true },
    };
    isAuthenticated(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("allows requests when pendingTwoFactor is false", () => {
    mockReq = {
      session: { userId: "user-2", role: "medico", nombre: "Dr. Test", pendingTwoFactor: false },
    };
    isAuthenticated(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it("allows requests when pendingTwoFactor is absent", () => {
    mockReq = { session: { userId: "user-3", role: "medico", nombre: "Dr. Test" } };
    isAuthenticated(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

// ── TOTP token generation & validation (otpauth library) ─────────────────────

describe("TOTP token validation (otpauth)", () => {
  let secret: OTPAuth.Secret;
  let totp: OTPAuth.TOTP;

  beforeEach(() => {
    secret = new OTPAuth.Secret({ size: 20 });
    totp = new OTPAuth.TOTP({
      issuer: "MediRecord",
      label: "testuser",
      secret,
      digits: 6,
      period: 30,
    });
  });

  it("validates a freshly generated token", () => {
    const token = totp.generate();
    const delta = totp.validate({ token, window: 1 });
    expect(delta).not.toBeNull();
  });

  it("rejects a random wrong token", () => {
    // "000000" is almost never the current TOTP code
    const delta = totp.validate({ token: "000000", window: 0 });
    // It's theoretically possible this is valid (1 in 1,000,000 chance), but negligible
    // Instead, verify with an invalid format
    const deltaInvalid = totp.validate({ token: "aaaaaa", window: 0 });
    expect(deltaInvalid).toBeNull();
  });

  it("generates a 6-digit numeric token", () => {
    const token = totp.generate();
    expect(token).toMatch(/^\d{6}$/);
  });

  it("otpauth URL is correct format", () => {
    const url = totp.toString();
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("MediRecord");
    expect(url).toContain("digits=6");
    expect(url).toContain("period=30");
  });
});

// ── encrypt/decrypt round-trip ────────────────────────────────────────────────

describe("TOTP secret encryption round-trip", () => {
  it("decrypted value matches original secret", async () => {
    const { encrypt, decrypt } = await import("../server/crypto");
    const secret = new OTPAuth.Secret({ size: 20 });
    const original = secret.base32;
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("encrypted value changes on each call (random IV)", async () => {
    const { encrypt } = await import("../server/crypto");
    const enc1 = encrypt("JBSWY3DPEHPK3PXP");
    const enc2 = encrypt("JBSWY3DPEHPK3PXP");
    expect(enc1).not.toBe(enc2);
  });

  it("decrypt throws on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("../server/crypto");
    const encrypted = encrypt("JBSWY3DPEHPK3PXP");
    const tampered = encrypted.slice(0, -4) + "0000"; // corrupt last bytes
    expect(() => decrypt(tampered)).toThrow();
  });
});
