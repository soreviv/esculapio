
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

// Mock storage
vi.mock("../server/storage", () => ({
  storage: {
    getLabOrder: vi.fn(),
    updateLabOrder: vi.fn(),
    createAuditLog: vi.fn(),
    getUserByUsername: vi.fn(),
  },
}));

import { storage } from "../server/storage";

describe("Lab Order Security Vulnerability", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Mock session middleware - simulates User 2 (Attacker)
    app.use((req, res, next) => {
      req.session = {
        userId: "doctor-2", // The attacker (trying to modify another doctor's order)
        role: "medico",
        nombre: "Dr. Attacker",
        regenerate: (cb: any) => cb(null),
        save: (cb: any) => cb(null),
        destroy: (cb: any) => cb(null),
        reload: (cb: any) => cb(null),
        touch: (cb: any) => cb(null),
        cookie: {} as any,
        id: "test-session-id",
      } as any;
      next();
    });

    const httpServer = createServer(app);
    await registerRoutes(httpServer, app);
  });

  it("should prevent a doctor from modifying another doctor's lab order", async () => {
    // Setup: Lab order belongs to doctor-1
    const existingOrder = {
      id: "order-123",
      patientId: "patient-1",
      medicoId: "doctor-1", // Owner is doctor-1
      estudios: ["Blood Test"],
      status: "pending",
    };

    // Mock storage to return the existing order
    vi.mocked(storage.getLabOrder).mockResolvedValue(existingOrder as any);
    // Mock update to succeed (simulate vulnerability behavior)
    vi.mocked(storage.updateLabOrder).mockResolvedValue({ ...existingOrder, status: "completed" } as any);

    const response = await request(app)
      .patch("/api/lab-orders/order-123")
      .send({ status: "completed" });

    // Expect 403 Forbidden because doctor-2 is not the owner
    // Currently this will fail (return 200) because the vulnerability exists
    expect(response.status).toBe(403);

    // Verify that we didn't update the order (if we were mocking update to happen)
    // But since we are asserting 403, if it returns 200, the test fails, which is what we want for reproduction.
  });

  it("should allow the owner doctor to modify their own lab order", async () => {
    // Setup: Lab order belongs to doctor-2 (who is the logged in user in this test setup)
    const existingOrder = {
      id: "order-456",
      patientId: "patient-1",
      medicoId: "doctor-2", // Owner is doctor-2 (matches session)
      estudios: ["Blood Test"],
      status: "pending",
    };

    // Mock storage
    vi.mocked(storage.getLabOrder).mockResolvedValue(existingOrder as any);
    vi.mocked(storage.updateLabOrder).mockResolvedValue({ ...existingOrder, status: "completed" } as any);

    const response = await request(app)
      .patch("/api/lab-orders/order-456")
      .send({ status: "completed" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("completed");
  });
});
