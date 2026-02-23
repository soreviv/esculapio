import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import * as auth from "../server/auth";

// Mock storage
vi.mock("../server/storage", () => ({
  storage: {
    getMedicalNote: vi.fn(),
    updateMedicalNote: vi.fn(),
    createAuditLog: vi.fn(),
    // Add other methods used by registerRoutes to prevent initialization errors
    getUserByUsername: vi.fn(),
    getDashboardMetrics: vi.fn(),
    searchPatientsAdvanced: vi.fn(),
    getPatients: vi.fn(),
    getPatient: vi.fn(),
    getPatientTimeline: vi.fn(),
    createPatient: vi.fn(),
    createPatientConsent: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    getMedicalNotesWithDetails: vi.fn(),
    createMedicalNote: vi.fn(),
    getAllVitals: vi.fn(),
    getVitals: vi.fn(),
    getLatestVitals: vi.fn(),
    createVitals: vi.fn(),
    getAllPrescriptions: vi.fn(),
    getPrescriptionsWithDetails: vi.fn(),
    createPrescription: vi.fn(),
    updatePrescription: vi.fn(),
    getAppointmentsByDateWithDetails: vi.fn(),
    getAppointmentsWithDetails: vi.fn(),
    getAppointmentsByPatient: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    getUsers: vi.fn(),
    getAuditLogs: vi.fn(),
    getAuditLogsByEntity: vi.fn(),
    getCie10Codes: vi.fn(),
    getCie10Code: vi.fn(),
    createCie10Code: vi.fn(),
    getPatientConsents: vi.fn(),
    getLabOrdersWithDetails: vi.fn(),
    getLabOrders: vi.fn(),
    getLabOrder: vi.fn(),
    createLabOrder: vi.fn(),
    updateLabOrder: vi.fn(),
    signMedicalNote: vi.fn(),
  }
}));

// Mock auth middleware
vi.mock("../server/auth", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isAuthenticated: (req, res, next) => {
      // Set session for mocked user
      req.session = { userId: "current-user-id", role: "medico", nombre: "Dr. Mock" };
      next();
    },
    isMedico: (req, res, next) => next(),
  };
});

describe("PATCH /api/notes/:id Access Control", () => {
  let app;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    // mocking session middleware behavior effectively done in isAuthenticated mock
    await registerRoutes(app, app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should allow author to update note", async () => {
    // Setup note belonging to current user
    (storage.getMedicalNote as any).mockResolvedValue({
      id: "note-123",
      medicoId: "current-user-id", // Matches mock session
      firmada: false,
      patientId: "patient-456",
      tipo: "consulta",
      fecha: new Date(),
    });

    (storage.updateMedicalNote as any).mockResolvedValue({
      id: "note-123",
      medicoId: "current-user-id",
      firmada: false,
      subjetivo: "Updated content",
      updated: true
    });

    const res = await request(app)
      .patch("/api/notes/note-123")
      .send({ subjetivo: "Updated content" });

    expect(res.status).toBe(200);
    expect(storage.updateMedicalNote).toHaveBeenCalledWith("note-123", expect.objectContaining({ subjetivo: "Updated content" }));
  });

  it("should PREVENT non-author from updating note", async () => {
    // Setup note belonging to DIFFERENT user
    (storage.getMedicalNote as any).mockResolvedValue({
      id: "note-123",
      medicoId: "other-doctor-id", // Different from "current-user-id"
      firmada: false,
      patientId: "patient-456",
      tipo: "consulta",
      fecha: new Date(),
    });

    const res = await request(app)
      .patch("/api/notes/note-123")
      .send({ subjetivo: "Hacked content" });

    // Expect 403 Forbidden - CURRENTLY FAILS (returns 200/500 depending on implementation details if update succeeds)
    // If vulnerable, it will likely return 200 or 500 (if updateMock returns undefined/null because updateMedicalNote not mocked for this case?)
    // Actually, updateMedicalNote is mocked but returns undefined by default unless mocked.
    // If I don't mock updateMedicalNote return, it returns undefined, so `const note = await ...` is undefined, returns 404 "Note not found" from route logic.
    // Wait, let's look at route logic:
    // const note = await storage.updateMedicalNote(req.params.id, req.body);
    // if (!note) { return res.status(404).json({ error: "Note not found" }); }

    // So if updateMedicalNote returns undefined (default mock), we get 404.
    // If updateMedicalNote returns something, we get 200.

    // To confirm vulnerability, we want to see it attempting to update.
    // But ideally we want 403 before even attempting update.

    // So let's mock updateMedicalNote to return something, so if access control is missing, it returns 200.
    (storage.updateMedicalNote as any).mockResolvedValue({
      id: "note-123",
      medicoId: "other-doctor-id",
      firmada: false,
      subjetivo: "Hacked content"
    });

    expect(res.status).toBe(403);

    // Also verify update was NOT called
    if (res.status === 403) {
      expect(storage.updateMedicalNote).not.toHaveBeenCalled();
    }
  });
});
