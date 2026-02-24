import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import { registerRoutes } from "../server/routes";

// Define the mock storage methods using vi.hoisted
const { mockStorage } = vi.hoisted(() => {
  return {
    mockStorage: {
      updatePrescription: vi.fn(),
      createAuditLog: vi.fn(),
      getPrescription: vi.fn(),
      getUsers: vi.fn().mockResolvedValue([]),
      getUser: vi.fn(),
      getUserByUsername: vi.fn(),
      createUser: vi.fn(),
    }
  }
});

vi.mock("../server/storage", () => ({
  storage: mockStorage
}));

// Mock auth
vi.mock("../server/auth", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    isAuthenticated: (req, res, next) => {
      if (req.session?.userId) return next();
      res.status(401).json({ error: "Unauthorized" });
    },
    isMedico: (req, res, next) => {
       if (req.session?.role === 'medico' || req.session?.role === 'admin') return next();
       res.status(403).json({ error: "Forbidden" });
    }
  };
});

describe("Prescription Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createApp = (userId: string, role: string = "medico") => {
    const app = express();
    app.use(express.json());
    app.use(session({ secret: "test", resave: false, saveUninitialized: true }));

    app.use((req, res, next) => {
      req.session.userId = userId;
      req.session.role = role;
      next();
    });

    return app;
  };

  it("should forbid updates from a different doctor (Broken Access Control Fix Verification)", async () => {
    const app = createApp("doctor-attacker");
    await registerRoutes({} as any, app);

    const originalPrescription = {
      id: "presc-123",
      medicoId: "doctor-original",
      patientId: "patient-456",
      medicamento: "Paracetamol",
    };

    mockStorage.getPrescription.mockResolvedValue(originalPrescription);
    mockStorage.updatePrescription.mockResolvedValue({ ...originalPrescription, medicamento: "Hacked" });

    const res = await request(app)
      .patch("/api/prescriptions/presc-123")
      .send({ medicamento: "Hacked" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/autor|permiso/i);
    expect(mockStorage.updatePrescription).not.toHaveBeenCalled();
  });

  it("should allow updates from the author doctor", async () => {
    const app = createApp("doctor-original");
    await registerRoutes({} as any, app);

    const originalPrescription = {
      id: "presc-123",
      medicoId: "doctor-original",
      patientId: "patient-456",
      medicamento: "Paracetamol",
    };

    const updatedPrescription = {
      ...originalPrescription,
      medicamento: "Ibuprofeno"
    };

    mockStorage.getPrescription.mockResolvedValue(originalPrescription);
    mockStorage.updatePrescription.mockResolvedValue(updatedPrescription);

    const res = await request(app)
      .patch("/api/prescriptions/presc-123")
      .send({ medicamento: "Ibuprofeno" });

    expect(res.status).toBe(200);
    expect(res.body.medicamento).toBe("Ibuprofeno");
    expect(mockStorage.updatePrescription).toHaveBeenCalled();

    // Check that immutable fields were removed from update call (partial check)
    // The implementation passes filtered body to updatePrescription.
    // We can spy on the argument passed to updatePrescription
    const updateArg = mockStorage.updatePrescription.mock.calls[0][1];
    expect(updateArg.medicoId).toBeUndefined();
    expect(updateArg.patientId).toBeUndefined();
  });

  it("should ensure immutable fields cannot be changed even by author", async () => {
    const app = createApp("doctor-original");
    await registerRoutes({} as any, app);

    const originalPrescription = {
      id: "presc-123",
      medicoId: "doctor-original",
      patientId: "patient-456",
    };

    mockStorage.getPrescription.mockResolvedValue(originalPrescription);
    // Even if storage returns whatever, we care about what was PASSED to storage
    mockStorage.updatePrescription.mockResolvedValue(originalPrescription);

    await request(app)
      .patch("/api/prescriptions/presc-123")
      .send({
        medicamento: "New Med",
        medicoId: "doctor-imposter", // Trying to change owner
        patientId: "patient-999" // Trying to change patient
      });

    const updateArg = mockStorage.updatePrescription.mock.calls[0][1];
    expect(updateArg.medicamento).toBe("New Med");
    expect(updateArg.medicoId).toBeUndefined(); 
    expect(updateArg.patientId).toBeUndefined();
  });
});
