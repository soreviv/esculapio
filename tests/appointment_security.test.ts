import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import http from "http";
import { registerRoutes } from "../server/routes";

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    getAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    createAuditLog: vi.fn(),
  },
}));

vi.mock("../server/storage", () => ({
  storage: mockStorage,
}));

vi.mock("../server/auth", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    isAuthenticated: (req: any, _res: any, next: any) => {
      if (req.session?.userId) return next();
      return _res.status(401).json({ error: "Unauthorized" });
    },
    isMedicoOrEnfermeria: (req: any, _res: any, next: any) => {
      const role = req.session?.role;
      if (role === "medico" || role === "enfermeria" || role === "admin") return next();
      return _res.status(403).json({ error: "Forbidden" });
    },
  };
});

describe("Appointment Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createApp = async (userId: string, role: string = "medico") => {
    const app = express();
    app.use(express.json());
    app.use(session({ secret: "test", resave: false, saveUninitialized: true }));

    app.use((req: any, _res: any, next: any) => {
      req.session.userId = userId;
      req.session.role = role;
      next();
    });

    const server = http.createServer(app);
    await registerRoutes(server, app);
    return app;
  };

  it("should return 403 and not update when another non-admin user tries to modify the appointment", async () => {
    const appointmentId = "appointment-1";
    const ownerDoctorId = "doctor-owner";
    const otherDoctorId = "doctor-other";

    const app = await createApp(otherDoctorId, "medico");

    mockStorage.getAppointment.mockResolvedValue({
      id: appointmentId,
      medicoId: ownerDoctorId,
      patientId: "patient-1",
      status: "pending",
      fecha: "2025-01-01",
      hora: "10:00:00",
      duracion: "30 min",
      motivo: "Consulta",
    });

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(403);
    expect(mockStorage.updateAppointment).not.toHaveBeenCalled();
  });

  it("should return 404 and not update when appointment does not exist", async () => {
    const appointmentId = "missing-appointment";
    const app = await createApp("any-user", "medico");

    mockStorage.getAppointment.mockResolvedValue(undefined);

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(404);
    expect(mockStorage.updateAppointment).not.toHaveBeenCalled();
  });

  it("should allow admin to update any appointment", async () => {
    const appointmentId = "appointment-2";
    const ownerDoctorId = "doctor-owner";

    const app = await createApp("admin-user", "admin");

    mockStorage.getAppointment.mockResolvedValue({
      id: appointmentId,
      medicoId: ownerDoctorId,
      patientId: "patient-1",
      status: "pending",
      fecha: "2025-01-01",
      hora: "10:00:00",
      duracion: "30 min",
      motivo: "Consulta",
    });

    mockStorage.updateAppointment.mockResolvedValue({
      id: appointmentId,
      medicoId: ownerDoctorId,
      patientId: "patient-1",
      status: "confirmed",
      fecha: "2025-01-01",
      hora: "10:00:00",
      duracion: "30 min",
      motivo: "Consulta",
    });

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(mockStorage.updateAppointment).toHaveBeenCalledWith(appointmentId, expect.objectContaining({ status: "confirmed" }));
  });

  it("should allow a nurse to update any appointment", async () => {
    const appointmentId = "appointment-nurse";
    const ownerDoctorId = "doctor-owner";

    const app = await createApp("nurse-1", "enfermeria");

    mockStorage.getAppointment.mockResolvedValue({
      id: appointmentId,
      medicoId: ownerDoctorId,
      patientId: "patient-1",
      status: "pending",
      fecha: "2025-01-01",
      hora: "10:00:00",
    });

    mockStorage.updateAppointment.mockResolvedValue({
      id: appointmentId,
      status: "confirmed"
    });

    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(mockStorage.updateAppointment).toHaveBeenCalledWith(appointmentId, expect.objectContaining({ status: "confirmed" }));
  });
});
