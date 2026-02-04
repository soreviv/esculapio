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
import { hashPassword, verifyPassword, validatePasswordStrength, isAuthenticated, isAdmin, isMedico, isEnfermeria, isMedicoOrEnfermeria } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  /**
   * @swagger
   * /login:
   *   post:
   *     tags: [Auth]
   *     summary: Iniciar sesión
   *     description: Autentica un usuario con nombre de usuario y contraseña
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, password]
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Autenticación exitosa
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Credenciales inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        await storage.createAuditLog({
          userId: null,
          accion: "login_fallido",
          entidad: "auth",
          entidadId: null,
          detalles: JSON.stringify({ username, reason: "user_not_found" }),
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.get("User-Agent") || null,
          fecha: new Date(),
        });
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
      
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        await storage.createAuditLog({
          userId: user.id,
          accion: "login_fallido",
          entidad: "auth",
          entidadId: user.id,
          detalles: JSON.stringify({ reason: "invalid_password" }),
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.get("User-Agent") || null,
          fecha: new Date(),
        });
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      req.session.regenerate(async (err) => {
        if (err) {
          return res.status(500).json({ error: "Error al iniciar sesión" });
        }

        try {
          req.session.userId = user.id;
          req.session.role = user.role;
          req.session.nombre = user.nombre;

          await storage.createAuditLog({
            userId: user.id,
            accion: "login",
            entidad: "auth",
            entidadId: user.id,
            detalles: JSON.stringify({ role: user.role }),
            ipAddress: req.ip || req.socket.remoteAddress || null,
            userAgent: req.get("User-Agent") || null,
            fecha: new Date(),
          });

          res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            nombre: user.nombre,
            especialidad: user.especialidad,
            cedula: user.cedula
          });
        } catch (error) {
          console.error("Login regeneration error:", error);
          res.status(500).json({ error: "Error al iniciar sesión" });
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  /**
   * @swagger
   * /logout:
   *   post:
   *     tags: [Auth]
   *     summary: Cerrar sesión
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente
   */
  app.post("/api/logout", (req, res) => {
    const userId = req.session?.userId;
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      if (userId) {
        storage.createAuditLog({
          userId,
          accion: "logout",
          entidad: "auth",
          entidadId: userId,
          detalles: null,
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.get("User-Agent") || null,
          fecha: new Date(),
        });
      }
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Obtener usuario actual
   *     responses:
   *       200:
   *         description: Usuario autenticado
   *       401:
   *         description: No autenticado
   */
  app.get("/api/auth/me", (req, res) => {
    if (req.session?.userId) {
      res.json({
        id: req.session.userId,
        role: req.session.role,
        nombre: req.session.nombre,
      });
    } else {
      res.status(401).json({ error: "No autenticado" });
    }
  });

  app.post("/api/register", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, password, role, nombre, especialidad, cedula } = req.body;
      
      if (!username || !password || !nombre) {
        return res.status(400).json({ error: "Username, password y nombre son requeridos" });
      }
      
      // Validate password strength with zxcvbn
      const passwordValidation = validatePasswordStrength(password, [username, nombre]);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "La contraseña no es suficientemente segura",
          passwordScore: passwordValidation.score,
          feedback: passwordValidation.feedback,
          crackTime: passwordValidation.crackTimeDisplay,
        });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "El usuario ya existe" });
      }
      
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: role || "medico",
        nombre,
        especialidad,
        cedula,
      });
      
      await storage.createAuditLog({
        userId: req.session.userId,
        accion: "crear",
        entidad: "users",
        entidadId: user.id,
        detalles: JSON.stringify({ role: user.role }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        nombre: user.nombre 
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // =====================
  // Dashboard Metrics
  // =====================
  
  /**
   * @swagger
   * /dashboard/metrics:
   *   get:
   *     tags: [Dashboard]
   *     summary: Obtener métricas del dashboard
   *     description: Retorna estadísticas generales de pacientes, citas, notas médicas
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Métricas del sistema
   */
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ error: "Error obteniendo métricas" });
    }
  });

  // =====================
  // Advanced Patient Search
  // =====================
  
  /**
   * @swagger
   * /patients/advanced-search:
   *   get:
   *     tags: [Patients]
   *     summary: Búsqueda avanzada de pacientes
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Término de búsqueda
   *       - in: query
   *         name: fechaDesde
   *         schema:
   *           type: string
   *         description: Fecha desde (YYYY-MM-DD)
   *       - in: query
   *         name: fechaHasta
   *         schema:
   *           type: string
   *         description: Fecha hasta (YYYY-MM-DD)
   *       - in: query
   *         name: diagnostico
   *         schema:
   *           type: string
   *         description: Código CIE-10
   *       - in: query
   *         name: medicoId
   *         schema:
   *           type: string
   *         description: ID del médico tratante
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Estado del paciente
   *     responses:
   *       200:
   *         description: Lista de pacientes filtrados
   */
  app.get("/api/patients/advanced-search", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const filters = {
        query: req.query.q as string | undefined,
        fechaDesde: req.query.fechaDesde as string | undefined,
        fechaHasta: req.query.fechaHasta as string | undefined,
        diagnostico: req.query.diagnostico as string | undefined,
        medicoId: req.query.medicoId as string | undefined,
        status: req.query.status as string | undefined,
      };
      const patients = await storage.searchPatientsAdvanced(filters);
      res.json(patients);
    } catch (error) {
      console.error("Advanced search error:", error);
      res.status(500).json({ error: "Error en búsqueda avanzada" });
    }
  });

  /**
   * @swagger
   * /patients:
   *   get:
   *     tags: [Patients]
   *     summary: Listar todos los pacientes
   *     description: Obtiene lista de pacientes. Requiere rol medico o enfermeria.
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Lista de pacientes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Patient'
   *       401:
   *         description: No autenticado
   *       403:
   *         description: Sin permisos suficientes
   */
  app.get("/api/patients", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error fetching patients" });
    }
  });

  /**
   * @swagger
   * /patients/search:
   *   get:
   *     tags: [Patients]
   *     summary: Buscar pacientes
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Término de búsqueda (nombre, CURP, expediente)
   *     responses:
   *       200:
   *         description: Resultados de búsqueda
   */
  app.get("/api/patients/search", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error searching patients" });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
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

  // =====================
  // Patient Timeline
  // =====================
  
  /**
   * @swagger
   * /patients/{id}/timeline:
   *   get:
   *     tags: [Patients]
   *     summary: Obtener historial clínico completo del paciente
   *     description: Retorna un timeline con notas médicas, signos vitales, recetas, citas y órdenes de laboratorio
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del paciente
   *     responses:
   *       200:
   *         description: Timeline del paciente
   *       404:
   *         description: Paciente no encontrado
   */
  app.get("/api/patients/:id/timeline", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }
      
      const timeline = await storage.getPatientTimeline(req.params.id);
      
      // Audit log for accessing patient timeline (NOM-024)
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "patient_timeline",
        entidadId: req.params.id,
        detalles: JSON.stringify({ eventos: timeline.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(timeline);
    } catch (error) {
      console.error("Timeline error:", error);
      res.status(500).json({ error: "Error obteniendo timeline" });
    }
  });

  /**
   * @swagger
   * /patients:
   *   post:
   *     tags: [Patients]
   *     summary: Crear nuevo paciente
   *     description: Crea un paciente con todos los campos requeridos por NOM-004. Si no se proporciona numeroExpediente, se genera automáticamente.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Patient'
   *     responses:
   *       201:
   *         description: Paciente creado exitosamente
   *       400:
   *         description: Datos inválidos
   */
  app.post("/api/patients", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      // Auto-generate numeroExpediente if not provided (NOM-004 compliance)
      const patientData = { ...req.body };
      if (!patientData.numeroExpediente) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        patientData.numeroExpediente = `EXP-${timestamp}-${random}`;
      }
      
      const parsed = insertPatientSchema.safeParse(patientData);
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

  app.patch("/api/patients/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      await storage.createAuditLog({
        userId: req.session.userId || req.body.updatedBy || null,
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

  app.delete("/api/patients/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const patient = await storage.deletePatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "eliminar",
        entidad: "patients",
        entidadId: patient.id,
        detalles: JSON.stringify({ curp: patient.curp }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Error deleting patient" });
    }
  });

  // Medical Notes (Protected - staff can read, doctors can write)
  app.get("/api/patients/:patientId/notes", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const notes = await storage.getMedicalNotesWithDetails(req.params.patientId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching notes" });
    }
  });

  app.get("/api/notes/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
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

  app.post("/api/notes", isAuthenticated, isMedico, async (req, res) => {
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

  app.patch("/api/notes/:id", isAuthenticated, isMedico, async (req, res) => {
    try {
      const existingNote = await storage.getMedicalNote(req.params.id);
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      if (existingNote.firmada && !req.body.firmada) {
        return res.status(403).json({ 
          error: "La nota ya está firmada y no puede ser modificada. Las notas firmadas son inmutables según la NOM-024-SSA3-2012." 
        });
      }
      
      const note = await storage.updateMedicalNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      await storage.createAuditLog({
        userId: req.session.userId || req.body.updatedBy || note.medicoId,
        accion: req.body.firmada ? "firmar" : "actualizar",
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

  // Vitals (Protected - requires medical/nursing staff)
  app.get("/api/vitals", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const vitalsList = await storage.getAllVitals();
      res.json(vitalsList);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vitals" });
    }
  });

  app.get("/api/patients/:patientId/vitals", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const vitalsList = await storage.getVitals(req.params.patientId);
      res.json(vitalsList);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vitals" });
    }
  });

  app.get("/api/patients/:patientId/vitals/latest", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const latest = await storage.getLatestVitals(req.params.patientId);
      res.json(latest || null);
    } catch (error) {
      res.status(500).json({ error: "Error fetching latest vitals" });
    }
  });

  app.post("/api/vitals", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const parsed = insertVitalsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const vitals = await storage.createVitals(parsed.data);
      
      await storage.createAuditLog({
        userId: req.session.userId || parsed.data.registradoPorId || null,
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

  // Prescriptions (Protected - staff can read, doctors can write)
  app.get("/api/prescriptions", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const allPrescriptions = await storage.getAllPrescriptions();
      res.json(allPrescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching prescriptions" });
    }
  });

  app.get("/api/patients/:patientId/prescriptions", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsWithDetails(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching prescriptions" });
    }
  });

  app.post("/api/prescriptions", isAuthenticated, isMedico, async (req, res) => {
    try {
      const parsed = insertPrescriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const prescription = await storage.createPrescription(parsed.data);
      
      await storage.createAuditLog({
        userId: req.session.userId || parsed.data.medicoId,
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

  app.patch("/api/prescriptions/:id", isAuthenticated, isMedico, async (req, res) => {
    try {
      const prescription = await storage.updatePrescription(req.params.id, req.body);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      
      await storage.createAuditLog({
        userId: req.session.userId || req.body.updatedBy || prescription.medicoId,
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

  // Appointments (Protected - staff access)
  app.get("/api/appointments", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
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

  app.get("/api/patients/:patientId/appointments", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error fetching appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const parsed = insertAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const appointment = await storage.createAppointment(parsed.data);
      
      await storage.createAuditLog({
        userId: req.session.userId || parsed.data.medicoId,
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

  app.patch("/api/appointments/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      await storage.createAuditLog({
        userId: req.session.userId || req.body.updatedBy || appointment.medicoId,
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

  // Users/Doctors (Protected - staff can view, admin for modification)
  app.get("/api/users", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  // ============= COMPLIANCE ROUTES (NOM-024-SSA3-2012 & LFPDPPP) =============

  // Audit Logs (Protected - admin only)
  app.get("/api/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Error fetching audit logs" });
    }
  });

  app.get("/api/audit-logs/:entidad/:entidadId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogsByEntity(req.params.entidad, req.params.entidadId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Error fetching audit logs" });
    }
  });

  app.post("/api/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
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

  // CIE-10 Catalog (Protected)
  app.get("/api/cie10", isAuthenticated, async (req, res) => {
    try {
      const search = req.query.q as string;
      const codes = await storage.getCie10Codes(search);
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching CIE-10 codes" });
    }
  });

  app.get("/api/cie10/:codigo", isAuthenticated, async (req, res) => {
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

  app.post("/api/cie10", isAuthenticated, isAdmin, async (req, res) => {
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

  // Patient Consents (Protected - staff access)
  app.get("/api/patients/:patientId/consents", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const consents = await storage.getPatientConsents(req.params.patientId);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ error: "Error fetching consents" });
    }
  });

  app.post("/api/patients/:patientId/consents", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
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

  // Lab Orders (Protected - staff can read, doctors can write)
  app.get("/api/lab-orders", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const orders = await storage.getLabOrdersWithDetails();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Error fetching lab orders" });
    }
  });

  app.get("/api/patients/:patientId/lab-orders", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const orders = await storage.getLabOrders(req.params.patientId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Error fetching lab orders" });
    }
  });

  app.get("/api/lab-orders/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const order = await storage.getLabOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Lab order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Error fetching lab order" });
    }
  });

  app.post("/api/lab-orders", isAuthenticated, isMedico, async (req, res) => {
    try {
      const order = await storage.createLabOrder(req.body);
      
      await storage.createAuditLog({
        userId: req.session.userId || req.body.medicoId,
        accion: "crear",
        entidad: "lab_order",
        entidadId: order.id,
        detalles: JSON.stringify({ estudios: order.estudios }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Error creating lab order" });
    }
  });

  app.patch("/api/lab-orders/:id", isAuthenticated, isMedico, async (req, res) => {
    try {
      const order = await storage.updateLabOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Lab order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Error updating lab order" });
    }
  });

  // Sign Medical Note (NOM-024-SSA3-2012 - Firma electrónica) - Protected
  app.post("/api/notes/:id/sign", isAuthenticated, isMedico, async (req, res) => {
    try {
      const userId = req.session.userId || req.body.userId;
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
