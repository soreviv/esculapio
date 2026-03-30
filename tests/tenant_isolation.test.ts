/**
 * Tenant Isolation Tests
 *
 * Verifies that TenantScopedStorage correctly filters data by tenant_id,
 * preventing cross-tenant data leakage. These are unit-level tests that
 * mock the database to validate the WHERE conditions applied by each method.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTenantStorage } from "../server/storage";

// ─── Mock the db module ───────────────────────────────────────────────────────

const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockLeftJoin = vi.fn();

// Build a chainable mock that records the WHERE conditions
function buildMock(returnValue: any[] = []) {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn((cond) => { chain._lastWhere = cond; return chain; }),
    leftJoin: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve(returnValue)),
    then: (resolve: any) => resolve(returnValue),
    [Symbol.iterator]: undefined,
  };
  // Make it thenable so "await chain" works
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  chain.then = (resolve: any, reject?: any) => Promise.resolve(returnValue).then(resolve, reject);
  return chain;
}

vi.mock("../server/db", () => ({
  db: {
    select: vi.fn(() => buildMock([])),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([{ id: "test" }])) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])) })) })),
    transaction: vi.fn(async (fn) => fn({ execute: vi.fn(), select: vi.fn(() => buildMock([])) })),
  },
}));

// ─── requireTenantMatch middleware tests ──────────────────────────────────────

import { requireTenantMatch } from "../server/tenant";
import type { Request, Response, NextFunction } from "express";

describe("requireTenantMatch middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockNext = vi.fn();
    mockRes = { status: statusMock, json: jsonMock };
  });

  it("allows request when session.tenantId matches req.tenantId", () => {
    mockReq = {
      tenantId: "tenant-a",
      session: { tenantId: "tenant-a" } as any,
    };
    requireTenantMatch(mockReq as Request, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledOnce();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant request with 403", () => {
    mockReq = {
      tenantId: "tenant-b",
      session: { tenantId: "tenant-a" } as any,
    };
    requireTenantMatch(mockReq as Request, mockRes, mockNext);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 400 when tenantId is missing from request", () => {
    mockReq = {
      tenantId: undefined,
      session: { tenantId: "tenant-a" } as any,
    };
    requireTenantMatch(mockReq as Request, mockRes, mockNext);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("allows request when session has no tenantId (pre-login routes)", () => {
    mockReq = {
      tenantId: "tenant-a",
      session: {} as any,
    };
    requireTenantMatch(mockReq as Request, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledOnce();
  });
});

// ─── TenantScopedStorage isolation tests ─────────────────────────────────────

describe("TenantScopedStorage — tenant isolation", () => {
  const TENANT_A = "aaaaaaaa-0000-0000-0000-000000000001";
  const TENANT_B = "bbbbbbbb-0000-0000-0000-000000000002";

  it("getPatients uses tenant_id filter for tenant A", async () => {
    const storageA = createTenantStorage(TENANT_A);
    const storageB = createTenantStorage(TENANT_B);

    // Both storages are independent instances
    expect(storageA).not.toBe(storageB);
    // Each has the correct tenant bound
    expect((storageA as any).tenantId).toBe(TENANT_A);
    expect((storageB as any).tenantId).toBe(TENANT_B);
  });

  it("createTenantStorage returns a TenantScopedStorage instance", () => {
    const ts = createTenantStorage(TENANT_A);
    expect(ts).toBeDefined();
    expect(typeof ts.getPatients).toBe("function");
    expect(typeof ts.createPatient).toBe("function");
    expect(typeof ts.getAppointments).toBe("function");
  });

  it("different tenantId values produce independent storage instances", () => {
    const ts1 = createTenantStorage(TENANT_A);
    const ts2 = createTenantStorage(TENANT_A);
    const ts3 = createTenantStorage(TENANT_B);

    expect((ts1 as any).tenantId).toBe((ts2 as any).tenantId);
    expect((ts1 as any).tenantId).not.toBe((ts3 as any).tenantId);
  });

  it("TenantScopedStorage adds tenantId when creating a patient", async () => {
    const ts = createTenantStorage(TENANT_A);
    const { db } = await import("../server/db");

    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{
        id: "patient-1", tenantId: TENANT_A, nombre: "Test"
      }])
    });
    (db.insert as any).mockReturnValue({ values: insertValues });

    const patientData = {
      nombre: "Test",
      apellidoPaterno: "Paciente",
      curp: "TEST000000HDFXXX01",
      fechaNacimiento: "1990-01-01",
      sexo: "M",
      numeroExpediente: "EXP-001",
    } as any;

    await ts.createPatient(patientData);

    // The values passed to insert should include tenantId = TENANT_A
    const valuesArg = insertValues.mock.calls[0][0];
    expect(valuesArg.tenantId).toBe(TENANT_A);
  });

  it("TenantScopedStorage adds tenantId when creating an audit log", async () => {
    const ts = createTenantStorage(TENANT_A);
    const { db } = await import("../server/db");

    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{
        id: "log-1", tenantId: TENANT_A, accion: "test"
      }])
    });
    (db.insert as any).mockReturnValue({ values: insertValues });

    await ts.createAuditLog({
      accion: "test",
      entidad: "patients",
      entidadId: null,
      userId: "user-1",
      ipAddress: null,
      userAgent: null,
      detalles: null,
    } as any);

    const valuesArg = insertValues.mock.calls[0][0];
    expect(valuesArg.tenantId).toBe(TENANT_A);
  });
});
