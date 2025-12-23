import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertMedicalNoteSchema, 
  insertVitalsSchema, 
  insertPrescriptionSchema, 
  insertAppointmentSchema,
  insertAuditLogSchema,
  insertCie10Schema,
  insertPatientConsentSchema
} from "@shared/schema";
import { createHash } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error fetching patients" });
    }
  });

  app.get("/api/patients/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error searching patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error fetching patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const parsed = insertPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const patient = await storage.createPatient(parsed.data);
      
      // Create audit log for patient creation (NOM-024 compliance)
      await storage.createAuditLog({
        userId: req.body.createdBy || null,
        accion: "crear",
        entidad: "patients",
        entidadId: patient.id,
        detalles: JSON.stringify({ curp: patient.curp }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      // Create consent records if provided (LFPDPPP compliance)
      if (req.body.consentimientoPrivacidad) {
        await storage.createPatientConsent({
          patientId: patient.id,
          tipoConsentimiento: "privacidad",
          version: "1.0",
          aceptado: true,
          fechaAceptacion: new Date(),
          ipAddress: req.ip || req.socket.remoteAddress || null,
        });
      }
      if (req.body.consentimientoExpediente) {
        await storage.createPatientConsent({
          patientId: patient.id,
          tipoConsentimiento: "expediente_electronico",
          version: "1.0",
          aceptado: true,
          fechaAceptacion: new Date(),
          ipAddress: req.ip || req.socket.remoteAddress || null,
        });
      }
      
      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error creating patient" });
    }
  });

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      await storage.createAuditLog({
        userId: req.body.updatedBy || null,
        accion: "actualizar",
        entidad: "patients",
        entidadId: patient.id,
        detalles: JSON.stringify({ campos: Object.keys(req.body) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error updating patient" });
    }
  });

  // Medical Notes (with doctor details)
  app.get("/api/patients/:patientId/notes", async (req, res) => {
    try {
      const notes = await storage.getMedicalNotesWithDetails(req.params.patientId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getMedicalNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Error fetching note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const parsed = insertMedicalNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const note = await storage.createMedicalNote(parsed.data);
      
      // Create audit log for note creation (NOM-024 compliance)
      await storage.createAuditLog({
        userId: parsed.data.medicoId,
        accion: "crear",
        entidad: "medical_notes",
        entidadId: note.id,
        detalles: JSON.stringify({ tipo: note.tipo, patientId: note.patientId }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Error creating note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateMedicalNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      await storage.createAuditLog({
        userId: req.body.updatedBy || note.medicoId,
        accion: "actualizar",
        entidad: "medical_notes",
        entidadId: note.id,
        detalles: JSON.stringify({ campos: Object.keys(req.body) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Error updating note" });
    }
  });

  // Vitals
  app.get("/api/vitals", async (req, res) => {
    try {
      const vitalsList = await storage.getAllVitals();
      res.json(vitalsList);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vitals" });
    }
  });

  app.get("/api/patients/:patientId/vitals", async (req, res) => {
    try {
      const vitalsList = await storage.getVitals(req.params.patientId);
      res.json(vitalsList);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vitals" });
    }
  });

  app.get("/api/patients/:patientId/vitals/latest", async (req, res) => {
    try {
      const latest = await storage.getLatestVitals(req.params.patientId);
      res.json(latest || null);
    } catch (error) {
      res.status(500).json({ error: "Error fetching latest vitals" });
    }
  });

  app.post("/api/vitals", async (req, res) => {
    try {
      const parsed = insertVitalsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const vitals = await storage.createVitals(parsed.data);
      
      // Create audit log for vitals recording (NOM-024 compliance)
      await storage.createAuditLog({
        userId: parsed.data.registradoPorId || null,
        accion: "crear",
        entidad: "vitals",
        entidadId: vitals.id,
        detalles: JSON.stringify({ patientId: vitals.patientId }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Error creating vitals" });
    }
  });

  // Prescriptions (with doctor details)
  app.get("/api/prescriptions", async (req, res) => {
    try {
      const allPrescriptions = await storage.getAllPrescriptions();
      res.json(allPrescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching prescriptions" });
    }
  });

  app.get("/api/patients/:patientId/prescriptions", async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsWithDetails(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching prescriptions" });
    }
  });

  app.post("/api/prescriptions", async (req, res) => {
    try {
      const parsed = insertPrescriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const prescription = await storage.createPrescription(parsed.data);
      
      // Create audit log for prescription creation (NOM-024 compliance)
      await storage.createAuditLog({
        userId: parsed.data.medicoId,
        accion: "crear",
        entidad: "prescriptions",
        entidadId: prescription.id,
        detalles: JSON.stringify({ medicamento: prescription.medicamento, patientId: prescription.patientId }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Error creating prescription" });
    }
  });

  app.patch("/api/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await storage.updatePrescription(req.params.id, req.body);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      
      await storage.createAuditLog({
        userId: req.body.updatedBy || prescription.medicoId,
        accion: "actualizar",
        entidad: "prescriptions",
        entidadId: prescription.id,
        detalles: JSON.stringify({ campos: Object.keys(req.body) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Error updating prescription" });
    }
  });

  // Appointments (with patient and doctor details)
  app.get("/api/appointments", async (req, res) => {
    try {
      const fecha = req.query.fecha as string;
      if (fecha) {
        const appointments = await storage.getAppointmentsByDateWithDetails(fecha);
        res.json(appointments);
      } else {
        const appointments = await storage.getAppointmentsWithDetails();
        res.json(appointments);
      }
    } catch (error) {
      res.status(500).json({ error: "Error fetching appointments" });
    }
  });

  app.get("/api/patients/:patientId/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error fetching appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const parsed = insertAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const appointment = await storage.createAppointment(parsed.data);
      
      await storage.createAuditLog({
        userId: parsed.data.medicoId,
        accion: "crear",
        entidad: "appointments",
        entidadId: appointment.id,
        detalles: JSON.stringify({ patientId: appointment.patientId, fecha: appointment.fecha }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Error creating appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      await storage.createAuditLog({
        userId: req.body.updatedBy || appointment.medicoId,
        accion: "actualizar",
        entidad: "appointments",
        entidadId: appointment.id,
        detalles: JSON.stringify({ campos: Object.keys(req.body) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Error updating appointment" });
    }
  });

  // Users/Doctors
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  // ============= COMPLIANCE ROUTES (NOM-024-SSA3-2012 & LFPDPPP) =============

  // Audit Logs (NOM-024-SSA3-2012 - Trazabilidad)
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Error fetching audit logs" });
    }
  });

  app.get("/api/audit-logs/:entidad/:entidadId", async (req, res) => {
    try {
      const logs = await storage.getAuditLogsByEntity(req.params.entidad, req.params.entidadId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Error fetching audit logs" });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const logData = {
        ...req.body,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("User-Agent"),
      };
      const parsed = insertAuditLogSchema.safeParse(logData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const log = await storage.createAuditLog(parsed.data);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: "Error creating audit log" });
    }
  });

  // CIE-10 Catalog (NOM-024-SSA3-2012 - Diagnósticos estandarizados)
  app.get("/api/cie10", async (req, res) => {
    try {
      const search = req.query.q as string;
      const codes = await storage.getCie10Codes(search);
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching CIE-10 codes" });
    }
  });

  app.get("/api/cie10/:codigo", async (req, res) => {
    try {
      const code = await storage.getCie10Code(req.params.codigo);
      if (!code) {
        return res.status(404).json({ error: "CIE-10 code not found" });
      }
      res.json(code);
    } catch (error) {
      res.status(500).json({ error: "Error fetching CIE-10 code" });
    }
  });

  app.post("/api/cie10", async (req, res) => {
    try {
      const parsed = insertCie10Schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const code = await storage.createCie10Code(parsed.data);
      res.status(201).json(code);
    } catch (error) {
      res.status(500).json({ error: "Error creating CIE-10 code" });
    }
  });

  // Patient Consents (LFPDPPP - Consentimiento informado)
  app.get("/api/patients/:patientId/consents", async (req, res) => {
    try {
      const consents = await storage.getPatientConsents(req.params.patientId);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ error: "Error fetching consents" });
    }
  });

  app.post("/api/patients/:patientId/consents", async (req, res) => {
    try {
      const consentData = {
        ...req.body,
        patientId: req.params.patientId,
        ipAddress: req.ip || req.socket.remoteAddress,
      };
      const parsed = insertPatientConsentSchema.safeParse(consentData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const consent = await storage.createPatientConsent(parsed.data);
      res.status(201).json(consent);
    } catch (error) {
      res.status(500).json({ error: "Error creating consent" });
    }
  });

  // Sign Medical Note (NOM-024-SSA3-2012 - Firma electrónica)
  app.post("/api/notes/:id/sign", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const note = await storage.getMedicalNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      if (note.firmada) {
        return res.status(400).json({ error: "Note already signed" });
      }
      
      const contentToSign = JSON.stringify({
        id: note.id,
        patientId: note.patientId,
        medicoId: note.medicoId,
        tipo: note.tipo,
        fecha: note.fecha,
        motivoConsulta: note.motivoConsulta,
        subjetivo: note.subjetivo,
        objetivo: note.objetivo,
        analisis: note.analisis,
        plan: note.plan,
        diagnosticos: note.diagnosticos,
      });
      
      const hash = createHash("sha256").update(contentToSign).digest("hex");
      
      const signedNote = await storage.signMedicalNote(req.params.id, userId, hash);
      
      await storage.createAuditLog({
        userId,
        accion: "firmar",
        entidad: "medical_notes",
        entidadId: req.params.id,
        detalles: JSON.stringify({ hash }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(signedNote);
    } catch (error) {
      res.status(500).json({ error: "Error signing note" });
    }
  });

  return httpServer;
}
