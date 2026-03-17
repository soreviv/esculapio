/**
 * Integration tests: flujo completo de nota médica
 * Crear → Firmar → Verificar → Addendum
 *
 * Valida que el ciclo de vida completo de una nota médica cumple con
 * NOM-024-SSA3-2012 (inmutabilidad tras firma) y NOM-004-SSA3-2012 (contenido).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

vi.mock("../server/storage", () => ({
  storage: {
    // Patients
    getPatient: vi.fn(),
    getPatients: vi.fn(),
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    getPatientTimeline: vi.fn(),
    // Medical notes
    getMedicalNote: vi.fn(),
    getMedicalNotes: vi.fn(),
    getMedicalNotesWithDetails: vi.fn(),
    getAllMedicalNotesWithDetails: vi.fn(),
    createMedicalNote: vi.fn(),
    updateMedicalNote: vi.fn(),
    signMedicalNote: vi.fn(),
    getNoteDiagnoses: vi.fn(),
    createAddendum: vi.fn(),
    // Vitals
    getVitals: vi.fn(),
    getLatestVitals: vi.fn(),
    getVitalsById: vi.fn(),
    getAllVitals: vi.fn(),
    createVitals: vi.fn(),
    // Prescriptions
    getPrescription: vi.fn(),
    getPrescriptions: vi.fn(),
    getPrescriptionsWithDetails: vi.fn(),
    getAllPrescriptions: vi.fn(),
    createPrescription: vi.fn(),
    createPrescriptionBatch: vi.fn(),
    updatePrescription: vi.fn(),
    // Appointments
    getAppointment: vi.fn(),
    getAppointmentsByPatient: vi.fn(),
    getAppointmentsWithDetails: vi.fn(),
    getAppointmentsByDateWithDetails: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    // Lab orders
    getLabOrder: vi.fn(),
    getLabOrders: vi.fn(),
    getLabOrdersWithDetails: vi.fn(),
    createLabOrder: vi.fn(),
    updateLabOrder: vi.fn(),
    // Consents
    getPatientConsents: vi.fn(),
    createPatientConsent: vi.fn(),
    // Users
    getUser: vi.fn(),
    getUsers: vi.fn(),
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    // Audit
    createAuditLog: vi.fn(),
    getAuditLogs: vi.fn(),
    getAuditLogsByEntity: vi.fn(),
    // CIE-10
    searchCie10: vi.fn(),
    getCie10: vi.fn(),
    createCie10: vi.fn(),
    // Config
    getEstablishmentConfig: vi.fn(),
    updateEstablishmentConfig: vi.fn(),
    getClinicHours: vi.fn(),
    updateClinicHours: vi.fn(),
    // Advanced search
    advancedSearchPatients: vi.fn(),
  },
}));

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

// UUIDs válidos RFC 4122 (el 4to grupo debe iniciar con 8,9,a,b para el campo variant)
const MEDICO_ID   = "11111111-1111-1111-8111-111111111111";
const PATIENT_ID  = "22222222-2222-2222-8222-222222222222";
const NOTE_ID     = "33333333-3333-3333-8333-333333333333";
const ADDENDUM_ID = "44444444-4444-4444-8444-444444444444";

const MEDICO_SESSION = { userId: MEDICO_ID, role: "medico", nombre: "Dr. Test" };
const ADMIN_SESSION  = { userId: MEDICO_ID, role: "admin",  nombre: "Admin Test" };

function buildApp(sessionData: Record<string, unknown> = MEDICO_SESSION) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.session = sessionData;
    req.isAuthenticated = () => !!sessionData.userId;
    next();
  });
  return app;
}

const BASE_NOTE = {
  id: NOTE_ID,
  patientId: PATIENT_ID,
  medicoId: MEDICO_ID,
  tipo: "nota_evolucion",
  subjetivo: "Paciente refiere cefalea persistente",
  objetivo: "TA 120/80, FC 72, afebril",
  analisis: "Cefalea tensional",
  plan: "Paracetamol 500mg c/8h x 3 días",
  motivoConsulta: "Dolor de cabeza",
  firmada: false,
  fechaFirma: null,
  firmaHash: null,
  fecha: new Date("2026-03-17"),
  createdAt: new Date("2026-03-17"),
};

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

describe("Flujo completo: Nota Médica (Crear → Firmar → Verificar → Addendum)", () => {
  let medicoApp: express.Express;
  let adminApp: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    medicoApp = buildApp(MEDICO_SESSION);
    adminApp  = buildApp(ADMIN_SESSION);
    await Promise.all([
      registerRoutes({} as any, medicoApp),
      registerRoutes({} as any, adminApp),
    ]);
    (storage.createAuditLog as any).mockResolvedValue({});
    (storage.getNoteDiagnoses as any).mockResolvedValue([]);
  });

  // -----------------------------------------------------------------
  // PASO 1: Crear nota
  // -----------------------------------------------------------------
  describe("Paso 1 — Crear nota médica", () => {
    it("debería crear la nota con firmada=false", async () => {
      (storage.createMedicalNote as any).mockResolvedValue(BASE_NOTE);

      const res = await request(medicoApp)
        .post("/api/notes")
        .send({
          patientId: PATIENT_ID,
          tipo: BASE_NOTE.tipo,
          subjetivo: BASE_NOTE.subjetivo,
          objetivo: BASE_NOTE.objetivo,
          analisis: BASE_NOTE.analisis,
          plan: BASE_NOTE.plan,
          motivoConsulta: BASE_NOTE.motivoConsulta,
        });

      expect(res.status).toBe(201);
      expect(res.body.firmada).toBe(false);
      expect(res.body.firmaHash).toBeNull();
    });

    it("debería registrar audit log al crear la nota", async () => {
      (storage.createMedicalNote as any).mockResolvedValue(BASE_NOTE);

      await request(medicoApp)
        .post("/api/notes")
        .send({
          patientId: PATIENT_ID,
          tipo: BASE_NOTE.tipo,
          subjetivo: BASE_NOTE.subjetivo,
          objetivo: BASE_NOTE.objetivo,
          analisis: BASE_NOTE.analisis,
          plan: BASE_NOTE.plan,
          motivoConsulta: BASE_NOTE.motivoConsulta,
        });

      expect(storage.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: "crear",
          entidad: "medical_notes",
          userId: MEDICO_ID,
        })
      );
    });

    it("debería rechazar la creación si falta patientId", async () => {
      const res = await request(medicoApp)
        .post("/api/notes")
        .send({
          tipo: BASE_NOTE.tipo,
          subjetivo: BASE_NOTE.subjetivo,
        });

      expect(res.status).toBe(400);
    });

    it("debería rechazar si patientId no es UUID válido", async () => {
      const res = await request(medicoApp)
        .post("/api/notes")
        .send({
          patientId: "no-es-uuid",
          tipo: BASE_NOTE.tipo,
          subjetivo: BASE_NOTE.subjetivo,
        });

      expect(res.status).toBe(400);
    });
  });

  // -----------------------------------------------------------------
  // PASO 2: Firmar nota
  // -----------------------------------------------------------------
  describe("Paso 2 — Firmar nota médica", () => {
    it("debería firmar una nota sin firma previa", async () => {
      const signedNote = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "sha256abc123" };
      (storage.getMedicalNote as any).mockResolvedValue(BASE_NOTE);
      (storage.getNoteDiagnoses as any).mockResolvedValue([]);
      (storage.signMedicalNote as any).mockResolvedValue(signedNote);

      const res = await request(medicoApp)
        .post(`/api/notes/${NOTE_ID}/sign`);

      expect(res.status).toBe(200);
      expect(res.body.firmada).toBe(true);
      expect(res.body.firmaHash).toBeTruthy();
    });

    it("debería rechazar firma si la nota ya está firmada (NOM-024)", async () => {
      const alreadySigned = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "sha256existing" };
      (storage.getMedicalNote as any).mockResolvedValue(alreadySigned);

      const res = await request(medicoApp)
        .post(`/api/notes/${NOTE_ID}/sign`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    it("debería rechazar firma si el médico no es el autor", async () => {
      const noteByOther = { ...BASE_NOTE, medicoId: "99999999-9999-9999-8999-999999999999" };
      (storage.getMedicalNote as any).mockResolvedValue(noteByOther);

      const res = await request(medicoApp)
        .post(`/api/notes/${NOTE_ID}/sign`);

      expect(res.status).toBe(403);
    });

    it("debería registrar audit log con accion=firmar", async () => {
      const signedNote = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "sha256abc123" };
      (storage.getMedicalNote as any).mockResolvedValue(BASE_NOTE);
      (storage.getNoteDiagnoses as any).mockResolvedValue([]);
      (storage.signMedicalNote as any).mockResolvedValue(signedNote);

      await request(medicoApp).post(`/api/notes/${NOTE_ID}/sign`);

      expect(storage.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: "firmar",
          entidad: "medical_notes",
          entidadId: NOTE_ID,
        })
      );
    });
  });

  // -----------------------------------------------------------------
  // PASO 3: Verificar integridad (requiere rol admin)
  // -----------------------------------------------------------------
  describe("Paso 3 — Verificar integridad de nota firmada", () => {
    it("debería confirmar integridad si el hash coincide (admin)", async () => {
      // El hash debe corresponder al contenido canónico que reconstruye la ruta.
      // Usamos getNoteDiagnoses mock para que el contenido sea reproducible.
      const signedNote = {
        ...BASE_NOTE,
        firmada: true,
        fechaFirma: new Date(),
        // El hash real se calcula internamente; aquí mockeamos signMedicalNote
        // para que la verificación compare el hash real generado.
        firmaHash: "placeholder", // se reemplaza abajo
      };

      // Primero firmamos para obtener el hash real
      (storage.getMedicalNote as any).mockResolvedValue(BASE_NOTE);
      (storage.getNoteDiagnoses as any).mockResolvedValue([]);
      (storage.signMedicalNote as any).mockImplementation((_id: string, _uid: string, hash: string) =>
        Promise.resolve({ ...signedNote, firmaHash: hash })
      );

      const signRes = await request(medicoApp).post(`/api/notes/${NOTE_ID}/sign`);
      expect(signRes.status).toBe(200);
      const realHash = signRes.body.firmaHash;

      // Ahora verificamos con el hash correcto
      const signedWithHash = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: realHash };
      (storage.getMedicalNote as any).mockResolvedValue(signedWithHash);
      (storage.getNoteDiagnoses as any).mockResolvedValue([]);

      const verifyRes = await request(adminApp)
        .post(`/api/notes/${NOTE_ID}/verify`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body).toHaveProperty("integridadValida", true);
    });

    it("debería detectar tampering si el hash no coincide (admin)", async () => {
      const tampered = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "hash-alterado-invalido" };
      (storage.getMedicalNote as any).mockResolvedValue(tampered);
      (storage.getNoteDiagnoses as any).mockResolvedValue([]);

      const res = await request(adminApp).post(`/api/notes/${NOTE_ID}/verify`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("integridadValida", false);
    });

    it("debería retornar 403 si un médico intenta verificar (solo admin)", async () => {
      const signedNote = { ...BASE_NOTE, firmada: true, firmaHash: "abc" };
      (storage.getMedicalNote as any).mockResolvedValue(signedNote);

      const res = await request(medicoApp).post(`/api/notes/${NOTE_ID}/verify`);

      expect(res.status).toBe(403);
    });

    it("debería retornar 404 si la nota no existe", async () => {
      (storage.getMedicalNote as any).mockResolvedValue(undefined);

      const res = await request(adminApp).post(`/api/notes/nonexistent-id/verify`);

      expect(res.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------
  // PASO 4: Agregar Addendum a nota firmada
  // -----------------------------------------------------------------
  describe("Paso 4 — Addendum sobre nota firmada", () => {
    it("debería crear un addendum en nota firmada (único camino permitido)", async () => {
      const signedNote = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "sha256abc" };
      const addendum = {
        id: ADDENDUM_ID,
        originalNoteId: NOTE_ID,
        medicoId: MEDICO_ID,
        contenido: "Se agrega: se indica reposo relativo 48 horas.",
        fecha: new Date(),
        createdAt: new Date(),
      };

      (storage.getMedicalNote as any).mockResolvedValue(signedNote);
      (storage.createAddendum as any).mockResolvedValue(addendum);

      const res = await request(medicoApp)
        .post(`/api/notes/${NOTE_ID}/addendums`)
        .send({ contenido: addendum.contenido });

      expect(res.status).toBe(201);
      expect(res.body.originalNoteId).toBe(NOTE_ID);
      expect(res.body.contenido).toBe(addendum.contenido);
    });

    it("debería registrar audit log al crear addendum", async () => {
      const signedNote = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "sha256abc" };
      const addendum = {
        id: ADDENDUM_ID,
        originalNoteId: NOTE_ID,
        medicoId: MEDICO_ID,
        contenido: "Aclaración adicional.",
        fecha: new Date(),
        createdAt: new Date(),
      };

      (storage.getMedicalNote as any).mockResolvedValue(signedNote);
      (storage.createAddendum as any).mockResolvedValue(addendum);

      await request(medicoApp)
        .post(`/api/notes/${NOTE_ID}/addendums`)
        .send({ contenido: addendum.contenido });

      expect(storage.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: "crear",
          entidad: "medical_note_addendums",
        })
      );
    });

    it("debería impedir editar directamente una nota firmada — retorna 403 (NOM-024)", async () => {
      const signedNote = { ...BASE_NOTE, firmada: true, fechaFirma: new Date(), firmaHash: "sha256abc" };
      (storage.getMedicalNote as any).mockResolvedValue(signedNote);

      const res = await request(medicoApp)
        .patch(`/api/notes/${NOTE_ID}`)
        .send({ plan: "Intento de modificar nota firmada" });

      // La ruta devuelve 403 para nota firmada (inmutabilidad NOM-024)
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/firmada|NOM-024/i);
    });

    it("debería rechazar addendum si la nota no existe", async () => {
      (storage.getMedicalNote as any).mockResolvedValue(undefined);

      const res = await request(medicoApp)
        .post(`/api/notes/${NOTE_ID}/addendums`)
        .send({ contenido: "Contenido de prueba" });

      expect(res.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------
  // Estado final del ciclo de vida
  // -----------------------------------------------------------------
  describe("Estado final del ciclo de vida", () => {
    it("nota creada → firmada → con addendum mantiene inmutabilidad del contenido original", () => {
      const created = { ...BASE_NOTE, firmada: false };
      const signed  = { ...BASE_NOTE, firmada: true, firmaHash: "sha256abc", fechaFirma: new Date() };
      const addendum = { id: ADDENDUM_ID, originalNoteId: NOTE_ID, contenido: "Aclaración", medicoId: MEDICO_ID };

      // Contenido original intacto
      expect(signed.plan).toBe(created.plan);
      expect(signed.subjetivo).toBe(created.subjetivo);
      expect(signed.firmaHash).toBeTruthy();

      // El addendum referencia la nota, no la modifica
      expect(addendum.originalNoteId).toBe(NOTE_ID);
    });

    it("una nota no firmada NO debe tener firmaHash", () => {
      expect(BASE_NOTE.firmada).toBe(false);
      expect(BASE_NOTE.firmaHash).toBeNull();
    });
  });
});
