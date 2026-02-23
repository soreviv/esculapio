import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

// Mock the storage
vi.mock("../server/storage", () => {
  return {
    storage: {
      getMedicalNote: vi.fn(),
      signMedicalNote: vi.fn(),
      createAuditLog: vi.fn(),
      getPrescription: vi.fn(),
      updatePrescription: vi.fn(),
      createMedicalNote: vi.fn(),
      updateMedicalNote: vi.fn(),
      createPatient: vi.fn(),
      updatePatient: vi.fn(),
      createLabOrder: vi.fn(),
    }
  };
});

describe("Security - Access Control", () => {
  let app: express.Express;
  let sessionData: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Mock session middleware
    app.use((req: any, res, next) => {
      req.session = sessionData;
      next();
    });

    await registerRoutes({} as any, app);

    sessionData = {
      userId: "user-1",
      role: "medico",
      nombre: "Dr. One"
    };
  });

  describe("Medical Note Signing", () => {
    it("should allow author to sign their own note", async () => {
      const noteId = "note-123";
      (storage.getMedicalNote as any).mockResolvedValue({
        id: noteId,
        medicoId: "user-1",
        firmada: false,
        patientId: "patient-1",
        tipo: "nota_evolucion"
      });
      (storage.signMedicalNote as any).mockResolvedValue({ id: noteId, firmada: true });

      const res = await request(app)
        .post(`/api/notes/${noteId}/sign`)
        .send({ userId: "attacker-id" }); // Attempt to override userId in body

      expect(res.status).toBe(200);
      expect(storage.signMedicalNote).toHaveBeenCalledWith(noteId, "user-1", expect.any(String));
    });

    it("should reject if a different doctor tries to sign a note", async () => {
      const noteId = "note-456";
      (storage.getMedicalNote as any).mockResolvedValue({
        id: noteId,
        medicoId: "user-2", // Authored by user-2
        firmada: false
      });

      const res = await request(app)
        .post(`/api/notes/${noteId}/sign`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("autor");
      expect(storage.signMedicalNote).not.toHaveBeenCalled();
    });
  });

  describe("Medical Note Modification", () => {
    it("should reject if a different doctor tries to update a note", async () => {
      const noteId = "note-789";
      (storage.getMedicalNote as any).mockResolvedValue({
        id: noteId,
        medicoId: "user-2",
        firmada: false
      });

      const res = await request(app)
        .patch(`/api/notes/${noteId}`)
        .send({ subjetivo: "Updated content" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("autor");
    });
  });

  describe("Prescription Modification", () => {
    it("should reject if a different doctor tries to update a prescription", async () => {
      const prescriptionId = "rx-123";
      (storage.getPrescription as any).mockResolvedValue({
        id: prescriptionId,
        medicoId: "user-2"
      });

      const res = await request(app)
        .patch(`/api/prescriptions/${prescriptionId}`)
        .send({ dosis: "Modified dose" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("médico autor");
    });
  });

  describe("Identity Enforcement", () => {
    it("should use session userId for lab orders instead of body medicoId", async () => {
      (storage.createLabOrder as any).mockResolvedValue({ id: "order-1", estudios: [] });

      const res = await request(app)
        .post("/api/lab-orders")
        .send({ medicoId: "other-doctor-id", estudios: ["CBC"] });

      expect(res.status).toBe(201);
      expect(storage.createLabOrder).toHaveBeenCalledWith(expect.objectContaining({
        medicoId: "user-1"
      }));
    });

    it("should use session userId for audit logs when creating notes", async () => {
      (storage.createMedicalNote as any).mockResolvedValue({ id: "note-new", patientId: "p1", tipo: "t1" });

      await request(app)
        .post("/api/notes")
        .send({ medicoId: "other-id", patientId: "p1", tipo: "history" });

      expect(storage.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        userId: "user-1"
      }));
    });
  });
});
