
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

// Mock storage
vi.mock("../server/storage", () => ({
  storage: {
    updateAppointment: vi.fn(),
    createAuditLog: vi.fn(),
    getAppointment: vi.fn(),
    getUserByUsername: vi.fn(),
    // Add other methods used by registerRoutes to avoid crashes
    getDashboardMetrics: vi.fn(),
    searchPatientsAdvanced: vi.fn(),
    getPatients: vi.fn(),
    searchPatients: vi.fn(),
    getPatient: vi.fn(),
    getPatientTimeline: vi.fn(),
    createPatient: vi.fn(),
    createPatientConsent: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    getMedicalNotesWithDetails: vi.fn(),
    getMedicalNote: vi.fn(),
    createMedicalNote: vi.fn(),
    updateMedicalNote: vi.fn(),
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
vi.mock("../server/auth", async () => {
  return {
    isAuthenticated: (req: any, res: any, next: any) => next(),
    isAdmin: (req: any, res: any, next: any) => next(), // Simplify for this test
    isMedico: (req: any, res: any, next: any) => next(),
    isEnfermeria: (req: any, res: any, next: any) => next(),
    isMedicoOrEnfermeria: (req: any, res: any, next: any) => next(),
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
    validatePasswordStrength: vi.fn(),
  };
});

describe("Appointment Update Security", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Middleware to simulate session
    app.use((req: any, res, next) => {
      req.session = req.headers['x-session'] ? JSON.parse(req.headers['x-session'] as string) : {};
      next();
    });

    await registerRoutes(app as any, app);

    vi.clearAllMocks();
  });

  it("should allow a doctor to update their own appointment", async () => {
    const doctorId = "doc-1";
    const appointmentId = "appt-1";

    // Setup mocks
    (storage.getAppointment as any).mockResolvedValue({
      id: appointmentId,
      medicoId: doctorId,
      patientId: "pat-1",
      fecha: "2023-01-01",
      hora: "10:00"
    });

    (storage.updateAppointment as any).mockResolvedValue({
      id: appointmentId,
      medicoId: doctorId,
      status: "confirmed"
    });

    const session = JSON.stringify({ userId: doctorId, role: "medico" });

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .set('x-session', session)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    // Before fix, it calls updateAppointment directly.
    // After fix, it should call getAppointment first, then updateAppointment.
    // For now, we expect updateAppointment to be called.
    expect(storage.updateAppointment).toHaveBeenCalledWith(appointmentId, { status: "confirmed" });
  });

  it("should PREVENT a doctor from updating another doctor's appointment", async () => {
    const doctorId = "doc-1";
    const otherDoctorId = "doc-2";
    const appointmentId = "appt-2";

    // Setup mocks
    (storage.getAppointment as any).mockResolvedValue({
      id: appointmentId,
      medicoId: otherDoctorId, // Different doctor
      patientId: "pat-1",
      fecha: "2023-01-01",
      hora: "10:00"
    });

    // Before fix, updateAppointment would be called.
    // After fix, it should NOT be called.
    (storage.updateAppointment as any).mockResolvedValue({
      id: appointmentId,
      medicoId: otherDoctorId,
      status: "confirmed"
    });

    const session = JSON.stringify({ userId: doctorId, role: "medico" });

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .set('x-session', session)
      .send({ status: "confirmed" });

    // EXPECTATION:
    // CURRENTLY (VULNERABLE): Status 200, updateAppointment called
    // FIXED: Status 403, updateAppointment NOT called

    // Since this is a repro test, we will assert the vulnerable behavior first to confirm it exists,
    // OR we can write the test expecting the fix and watch it fail.
    // I will write it expecting the FIX, so it fails now.

    expect(res.status).toBe(403);
    expect(storage.updateAppointment).not.toHaveBeenCalled();
  });

  it("should allow a nurse to update any appointment", async () => {
    const doctorId = "doc-1";
    const appointmentId = "appt-3";

    // Setup mocks
    (storage.getAppointment as any).mockResolvedValue({
      id: appointmentId,
      medicoId: doctorId,
      patientId: "pat-1",
      fecha: "2023-01-01",
      hora: "10:00"
    });

    (storage.updateAppointment as any).mockResolvedValue({
      id: appointmentId,
      medicoId: doctorId,
      status: "confirmed"
    });

    const session = JSON.stringify({ userId: "nurse-1", role: "enfermeria" });

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .set('x-session', session)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(storage.updateAppointment).toHaveBeenCalledWith(appointmentId, { status: "confirmed" });
  });
});
