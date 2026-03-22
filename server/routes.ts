import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  patientToFhir,
  userToPractitioner,
  medicalNoteToEncounter,
  vitalsToObservations,
  prescriptionToMedicationRequest,
  labOrderToServiceRequest,
  createPatientBundle,
  getCapabilityStatement,
} from "@shared/fhir-mappers";
import { 
  insertPatientSchema, 
  insertMedicalNoteSchema, 
  insertMedicalNoteAddendumSchema,
  insertVitalsSchema, 
  insertPrescriptionSchema, 
  insertAppointmentSchema,
  insertAuditLogSchema,
  insertCie10Schema,
  insertPatientConsentSchema
} from "@shared/schema";
import { createHash, randomUUID, randomBytes } from "crypto";
import { sendPasswordResetEmail } from "./mailer";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { encrypt, decrypt } from "./crypto";
import { hashPassword, verifyPassword, validatePasswordStrength, isAuthenticated, isAdmin, isMedico, isMedicoOrEnfermeria } from "./auth";
import { isTokenReplayed, markTokenUsed, getLockoutExpiry, recordFailure, clearFailures } from "./totp-guard";

/**
 * Registra y configura todos los endpoints REST bajo /api en la aplicación Express proporcionada.
 *
 * Registra rutas de autenticación, gestión de usuarios, pacientes, notas médicas, signos vitales,
 * recetas, citas, órdenes de laboratorio, registros de auditoría y catálogos, además de los
 * middleware de control de acceso necesarios (p. ej. isAuthenticated, isAdmin, isMedico).
 *
 * @param httpServer - Instancia del servidor HTTP que se devuelve tras agregar las rutas
 * @param app - Instancia de Express sobre la que se montan los endpoints y middleware
 * @returns El mismo objeto `Server` pasado como `httpServer`
 */
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

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Error regenerating session:", err);
            return reject(err);
          }
          resolve();
        });
      }).catch(() => {
        return res.status(500).json({ error: "Error al iniciar sesión" });
      });

      if (res.headersSent) return;

      // If 2FA is enabled, pause login until TOTP is verified
      if (user.totpEnabled) {
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.nombre = user.nombre;
        req.session.pendingTwoFactor = true;
        req.session.pendingTwoFactorExpiry = Date.now() + 5 * 60 * 1000; // 5-minute window

        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        }).catch(() => res.status(500).json({ error: "Error al guardar la sesión" }));

        if (res.headersSent) return;
        return res.status(200).json({ requiresTwoFactor: true });
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.nombre = user.nombre;

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return reject(err);
          }
          resolve();
        });
      }).catch(() => {
        return res.status(500).json({ error: "Error al guardar la sesión" });
      });

      if (res.headersSent) return;

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
  // Password reset — request link via email
  app.post("/api/password-reset-request", async (req, res) => {
    const GENERIC_OK = { message: "Si la cuenta existe, recibirá un correo con instrucciones." };
    try {
      const { username } = req.body;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "El usuario es requerido" });
      }

      const user = await storage.getUserByUsername(username.trim());
      if (!user) {
        return res.json(GENERIC_OK);
      }

      if (!user.email) {
        await storage.createAuditLog({
          userId: user.id,
          accion: "password_reset_request_no_email",
          entidad: "auth",
          entidadId: user.id,
          detalles: JSON.stringify({ username: user.username }),
          ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
          userAgent: req.get("User-Agent") ?? null,
          fecha: new Date(),
        });
        return res.json(GENERIC_OK);
      }

      const plainToken = randomBytes(32).toString("hex");
      const hashedToken = createHash("sha256").update(plainToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken({ userId: user.id, token: hashedToken, expiresAt, usedAt: null });

      await storage.createAuditLog({
        userId: user.id,
        accion: "password_reset_request",
        entidad: "auth",
        entidadId: user.id,
        detalles: JSON.stringify({ username: user.username }),
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        userAgent: req.get("User-Agent") ?? null,
        fecha: new Date(),
      });

      sendPasswordResetEmail(user.email, user.nombre, plainToken).catch((err) => {
        console.error("[mailer] Error al enviar correo de recuperación:", err);
      });

      res.json(GENERIC_OK);
    } catch (error) {
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  });

  // Password reset — validate token
  app.get("/api/password-reset-validate/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) return res.status(400).json({ valid: false, error: "Token requerido" });

      const hashedToken = createHash("sha256").update(token).digest("hex");
      const record = await storage.getPasswordResetToken(hashedToken);

      if (!record) return res.status(404).json({ valid: false, error: "Token inválido o expirado" });
      if (record.usedAt) return res.status(410).json({ valid: false, error: "El token ya fue utilizado" });
      if (new Date() > record.expiresAt) return res.status(410).json({ valid: false, error: "El token ha expirado" });

      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ valid: false, error: "Error al validar el token" });
    }
  });

  // Password reset — confirm new password
  app.post("/api/password-reset-confirm", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || typeof token !== "string") return res.status(400).json({ error: "Token requerido" });
      if (!password || typeof password !== "string") return res.status(400).json({ error: "La nueva contraseña es requerida" });

      const strengthResult = validatePasswordStrength(password);
      if (!strengthResult.valid) {
        return res.status(422).json({
          error: "La contraseña no cumple los requisitos de seguridad",
          feedback: strengthResult.feedback,
          score: strengthResult.score,
        });
      }

      const hashedToken = createHash("sha256").update(token).digest("hex");
      const record = await storage.getPasswordResetToken(hashedToken);
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
      const userAgent = req.get("User-Agent") ?? null;

      if (!record || record.usedAt || new Date() > record.expiresAt) {
        if (record?.userId) {
          await storage.createAuditLog({
            userId: record.userId,
            accion: "password_reset_confirm_failed",
            entidad: "auth",
            entidadId: record.userId,
            detalles: JSON.stringify({ reason: record.usedAt ? "token_already_used" : "token_expired_or_invalid" }),
            ipAddress,
            userAgent,
            fecha: new Date(),
          });
        }
        return res.status(410).json({ error: "El token es inválido, ha expirado o ya fue utilizado" });
      }

      const newHash = await hashPassword(password);
      await storage.updateUserPassword(record.userId, newHash);
      await storage.markPasswordResetTokenUsed(record.id);

      await storage.createAuditLog({
        userId: record.userId,
        accion: "password_reset_confirm",
        entidad: "auth",
        entidadId: record.userId,
        detalles: JSON.stringify({ tokenId: record.id }),
        ipAddress,
        userAgent,
        fecha: new Date(),
      });

      res.json({ message: "Contraseña restablecida exitosamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al restablecer la contraseña" });
    }
  });

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

  // ── 2FA endpoints ───────────────────────────────────────────────────────────

  // Verify TOTP during login (session is pendingTwoFactor)
  app.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { code } = req.body;
      if (!req.session?.userId || !req.session?.pendingTwoFactor) {
        return res.status(401).json({ error: "No hay sesión pendiente de verificación" });
      }

      // Check that the pending 2FA window has not expired (5 minutes)
      if (!req.session.pendingTwoFactorExpiry || Date.now() > req.session.pendingTwoFactorExpiry) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "La sesión de verificación ha expirado. Inicie sesión nuevamente." });
      }

      if (!code) {
        return res.status(400).json({ error: "El código es requerido" });
      }

      const userId = req.session.userId;

      // Check brute-force lockout
      const lockUntil = getLockoutExpiry(userId);
      if (lockUntil) {
        const remainingMin = Math.ceil((lockUntil - Date.now()) / 60_000);
        return res.status(429).json({
          error: `Demasiados intentos fallidos. Intente de nuevo en ${remainingMin} minuto(s).`,
        });
      }

      const user = await storage.getUser(userId);
      if (!user?.totpSecret) {
        return res.status(400).json({ error: "2FA no configurado" });
      }

      const token = String(code).replace(/\s/g, "");

      // Replay attack prevention
      if (isTokenReplayed(userId, token)) {
        return res.status(401).json({ error: "Este código ya fue utilizado. Espere el siguiente código." });
      }

      const totp = new OTPAuth.TOTP({
        issuer: "MediRecord",
        label: user.username,
        secret: OTPAuth.Secret.fromBase32(decrypt(user.totpSecret)),
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token, window: 1 });
      if (delta === null) {
        const failCount = recordFailure(userId);
        await storage.createAuditLog({
          userId: user.id,
          accion: "login_2fa_fallido",
          entidad: "auth",
          entidadId: user.id,
          detalles: JSON.stringify({ reason: "invalid_totp", failCount }),
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.get("User-Agent") || null,
          fecha: new Date(),
        });
        return res.status(401).json({ error: "Código incorrecto o expirado" });
      }

      // Mark token as used to prevent replays
      markTokenUsed(userId, token);
      clearFailures(userId);

      // Complete login
      req.session.pendingTwoFactor = false;
      req.session.pendingTwoFactorExpiry = undefined;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      await storage.createAuditLog({
        userId: user.id,
        accion: "login",
        entidad: "auth",
        entidadId: user.id,
        detalles: JSON.stringify({ role: user.role, metodo: "totp" }),
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
        cedula: user.cedula,
      });
    } catch (error) {
      res.status(500).json({ error: "Error al verificar el código" });
    }
  });

  // Generate TOTP secret and QR code (first-time setup)
  app.post("/api/auth/2fa/setup", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

      if (user.totpEnabled) {
        return res.status(400).json({ error: "2FA ya está activado. Desactívalo primero." });
      }

      const secret = new OTPAuth.Secret({ size: 20 });
      await storage.setTotpSecret(user.id, encrypt(secret.base32));

      const totp = new OTPAuth.TOTP({
        issuer: "MediRecord",
        label: user.username,
        secret,
        digits: 6,
        period: 30,
      });

      const otpAuthUrl = totp.toString();
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

      res.json({
        secret: secret.base32,
        otpAuthUrl,
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      res.status(500).json({ error: "Error al generar el código 2FA" });
    }
  });

  // Confirm setup by verifying the first TOTP code
  app.post("/api/auth/2fa/setup/confirm", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "El código es requerido" });

      const user = await storage.getUser(req.session.userId!);
      if (!user?.totpSecret) {
        return res.status(400).json({ error: "Primero genera el secreto con POST /api/auth/2fa/setup" });
      }
      if (user.totpEnabled) {
        return res.status(400).json({ error: "2FA ya está activado" });
      }

      const totp = new OTPAuth.TOTP({
        issuer: "MediRecord",
        label: user.username,
        secret: OTPAuth.Secret.fromBase32(decrypt(user.totpSecret)),
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: String(code).replace(/\s/g, ""), window: 1 });
      if (delta === null) {
        return res.status(401).json({ error: "Código incorrecto. Intente de nuevo." });
      }

      await storage.enableTotp(user.id);

      await storage.createAuditLog({
        userId: user.id,
        accion: "2fa_activado",
        entidad: "auth",
        entidadId: user.id,
        detalles: JSON.stringify({}),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.json({ message: "Autenticación de dos factores activada exitosamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al activar 2FA" });
    }
  });

  // Disable 2FA (requires current TOTP code to confirm)
  app.post("/api/auth/2fa/disable", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "El código TOTP es requerido para desactivar 2FA" });

      const user = await storage.getUser(req.session.userId!);
      if (!user?.totpEnabled || !user.totpSecret) {
        return res.status(400).json({ error: "2FA no está activado" });
      }

      const totp = new OTPAuth.TOTP({
        issuer: "MediRecord",
        label: user.username,
        secret: OTPAuth.Secret.fromBase32(decrypt(user.totpSecret)),
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: String(code).replace(/\s/g, ""), window: 1 });
      if (delta === null) {
        return res.status(401).json({ error: "Código incorrecto" });
      }

      await storage.disableTotp(user.id);

      await storage.createAuditLog({
        userId: user.id,
        accion: "2fa_desactivado",
        entidad: "auth",
        entidadId: user.id,
        detalles: JSON.stringify({}),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.json({ message: "Autenticación de dos factores desactivada" });
    } catch (error) {
      res.status(500).json({ error: "Error al desactivar 2FA" });
    }
  });

  // Status — returns whether current user has 2FA enabled
  app.get("/api/auth/2fa/status", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      res.json({ totpEnabled: user?.totpEnabled ?? false });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener estado 2FA" });
    }
  });


  app.post("/api/register", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, password, role, nombre, especialidad, cedula, email } = req.body;
      
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
        email: email || null,
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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "patients",
        entidadId: null,
        detalles: JSON.stringify({ accion: "listar_pacientes", total: patients.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "patients",
        entidadId: null,
        detalles: JSON.stringify({ accion: "buscar_pacientes", query, resultados: patients.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
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

      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "patients",
        entidadId: patient.id,
        detalles: JSON.stringify({ curp: patient.curp }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error fetching patient" });
    }
  });

  // ... (Patient Timeline route follows) ...

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
        userId: req.session.userId,
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
        userId: req.session.userId,
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
  app.get("/api/notes", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const notes = await storage.getAllMedicalNotesWithDetails();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching notes" });
    }
  });

  app.get("/api/patients/:patientId/notes", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const notes = await storage.getMedicalNotesWithDetails(req.params.patientId);
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "medical_notes",
        entidadId: null,
        detalles: JSON.stringify({ patientId: req.params.patientId, total: notes.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
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

      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "medical_notes",
        entidadId: note.id,
        detalles: JSON.stringify({ tipo: note.tipo }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Error fetching note" });
    }
  });

  app.post("/api/notes/:id/addendums", isAuthenticated, isMedico, async (req, res) => {
    try {
      const note = await storage.getMedicalNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Nota médica no encontrada" });
      }

      const addendumData = {
        ...req.body,
        originalNoteId: req.params.id,
        medicoId: req.session.userId,
      };

      const parsed = insertMedicalNoteAddendumSchema.safeParse(addendumData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const addendum = await storage.createAddendum(parsed.data);

      await storage.createAuditLog({
        userId: req.session.userId,
        accion: "crear",
        entidad: "medical_note_addendums",
        entidadId: addendum.id,
        detalles: JSON.stringify({ originalNoteId: req.params.id }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.status(201).json(addendum);
    } catch (error) {
      console.error("Error creating addendum:", error);
      res.status(500).json({ error: "Error al crear anexo" });
    }
  });

  app.post("/api/notes", isAuthenticated, isMedico, async (req, res) => {
    try {
      const { diagnoses, ...noteData } = req.body;

      // Always enforce the authenticated user as the author and use server-side date
      // (client-provided medicoId may be a placeholder; fecha may be an ISO string)
      noteData.medicoId = req.session.userId!;
      if (noteData.fecha && typeof noteData.fecha === "string") {
        noteData.fecha = new Date(noteData.fecha);
      }

      const parsed = insertMedicalNoteSchema.safeParse(noteData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const note = await storage.createMedicalNote(parsed.data, diagnoses);
      
      // Create audit log for note creation (NOM-024 compliance)
      await storage.createAuditLog({
        userId: req.session.userId,
        accion: "crear",
        entidad: "medical_notes",
        entidadId: note.id,
        detalles: JSON.stringify({ tipo: note.tipo, patientId: note.patientId, diagnosesCount: diagnoses?.length || 0 }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Error creating note" });
    }
  });

  app.patch("/api/notes/:id", isAuthenticated, isMedico, async (req, res) => {
    try {
      const existingNote = await storage.getMedicalNote(req.params.id);
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Solo el autor puede modificar la nota
      if (existingNote.medicoId !== req.session.userId) {
        return res.status(403).json({ error: "Solo el autor puede modificar la nota" });
      }
      
      if (existingNote.firmada) {
        return res.status(403).json({ 
          error: "La nota ya está firmada y no puede ser modificada. Las notas firmadas son inmutables según la NOM-024-SSA3-2012." 
        });
      }
      
      const note = await storage.updateMedicalNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      await storage.createAuditLog({
        userId: req.session.userId,
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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "vitals",
        entidadId: null,
        detalles: JSON.stringify({ patientId: req.params.patientId, total: vitalsList.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.json(vitalsList);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vitals" });
    }
  });

  app.get("/api/patients/:patientId/vitals/latest", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const latest = await storage.getLatestVitals(req.params.patientId);
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "vitals",
        entidadId: latest?.id || null,
        detalles: JSON.stringify({ patientId: req.params.patientId, accion: "ultimo_registro" }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
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

      // Enforce the current user as the one who registered the vitals
      parsed.data.registradoPorId = req.session.userId!;

      const vitals = await storage.createVitals(parsed.data);
      
      await storage.createAuditLog({
        userId: req.session.userId,
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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "prescriptions",
        entidadId: null,
        detalles: JSON.stringify({ patientId: req.params.patientId, total: prescriptions.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching prescriptions" });
    }
  });

  // Batch prescription creation — all medications share a receta_id
  app.post("/api/prescriptions/batch", isAuthenticated, isMedico, async (req, res) => {
    try {
      const { patientId, instruccionesGenerales, medicamentos } = req.body;

      if (!patientId || !Array.isArray(medicamentos) || medicamentos.length === 0) {
        return res.status(400).json({ error: "Se requiere patientId y al menos un medicamento" });
      }

      const recetaId = randomUUID();
      const medicoId = req.session.userId!;

      const itemSchemas = medicamentos.map((med: unknown) =>
        insertPrescriptionSchema.safeParse({
          ...(med as object),
          patientId,
          medicoId,
          recetaId,
          instruccionesGenerales: instruccionesGenerales || null,
          status: "activa",
        })
      );

      const invalid = itemSchemas.find((r) => !r.success);
      if (invalid && !invalid.success) {
        return res.status(400).json({ error: invalid.error.errors });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = itemSchemas.map((r) => (r as any).data);
      const created = await storage.createPrescriptionBatch(items);

      await storage.createAuditLog({
        userId: medicoId,
        accion: "crear_receta",
        entidad: "prescriptions",
        entidadId: null,
        detalles: JSON.stringify({ recetaId, patientId, medicamentos: created.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.status(201).json({ recetaId, prescriptions: created });
    } catch (error) {
      res.status(500).json({ error: "Error al crear la receta" });
    }
  });

  app.post("/api/prescriptions", isAuthenticated, isMedico, async (req, res) => {
    try {
      const parsed = insertPrescriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      // Enforce the current user as the author
      parsed.data.medicoId = req.session.userId!;

      const prescription = await storage.createPrescription(parsed.data);
      
      await storage.createAuditLog({
        userId: req.session.userId,
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
      const existingPrescription = await storage.getPrescription(req.params.id);
      if (!existingPrescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      // NOM-004-SSA3-2012: Solo el médico autor puede modificar la receta
      if (existingPrescription.medicoId !== req.session.userId) {
        return res.status(403).json({ error: "No autorizado. Solo el médico autor puede modificar esta receta (NOM-004-SSA3-2012)." });
      }

      // Inmutabilidad de campos críticos (medicoId y patientId no deben cambiar)
      const { medicoId, patientId, id, ...updateData } = req.body;

      const updatedPrescription = await storage.updatePrescription(req.params.id, updateData);

      if (!updatedPrescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      await storage.createAuditLog({
        userId: req.session.userId,
        accion: "actualizar",
        entidad: "prescriptions",
        entidadId: updatedPrescription.id,
        detalles: JSON.stringify({ campos: Object.keys(updateData) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(updatedPrescription);
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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "appointments",
        entidadId: null,
        detalles: JSON.stringify({ patientId: req.params.patientId, total: appointments.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
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
        userId: req.session.userId,
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
      const existingAppointment = await storage.getAppointment(req.params.id);
      if (!existingAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Check permissions: admin and nurses can update any. Doctors only their own.
      const isOwner = existingAppointment.medicoId === req.session.userId;
      const canUpdate = req.session.role === "admin" || req.session.role === "enfermeria" || isOwner;

      if (!canUpdate) {
        return res.status(403).json({ error: "No tiene permiso para modificar esta cita." });
      }

      const parsed = insertAppointmentSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      if (Object.keys(parsed.data).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedAppointment = await storage.updateAppointment(req.params.id, parsed.data);
      if (!updatedAppointment) {
        return res.status(404).json({ error: "Appointment not found during update" });
      }
      
      await storage.createAuditLog({
        userId: req.session.userId,
        accion: "actualizar",
        entidad: "appointments",
        entidadId: updatedAppointment.id,
        detalles: JSON.stringify({ campos: Object.keys(parsed.data) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      
      res.json(updatedAppointment);
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

  app.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, nombre, especialidad, cedula } = req.body;
      const updated = await storage.updateUser(req.params.id, { email, nombre, especialidad, cedula });
      if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar el usuario" });
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

      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "cie10_catalog",
        entidadId: code.codigo,
        detalles: JSON.stringify({ descripcion: code.descripcion }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "lab_orders",
        entidadId: null,
        detalles: JSON.stringify({ patientId: req.params.patientId, total: orders.length }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
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
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "lab_orders",
        entidadId: order.id,
        detalles: JSON.stringify({ patientId: order.patientId }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Error fetching lab order" });
    }
  });

  app.post("/api/lab-orders", isAuthenticated, isMedico, async (req, res) => {
    try {
      const order = await storage.createLabOrder({ ...req.body, medicoId: req.session.userId });
      
      await storage.createAuditLog({
        userId: req.session.userId,
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
      const existingOrder = await storage.getLabOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Lab order not found" });
      }

      // Solo el médico que creó la orden puede modificarla
      if (existingOrder.medicoId !== req.session.userId) {
        return res.status(403).json({ error: "No autorizado. Solo el médico que creó la orden puede modificarla." });
      }

      const order = await storage.updateLabOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Lab order not found" });
      }

      await storage.createAuditLog({
        userId: req.session.userId,
        accion: "actualizar",
        entidad: "lab_order",
        entidadId: order.id,
        detalles: JSON.stringify({ campos: Object.keys(req.body) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Error updating lab order" });
    }
  });

  // Helper function to generate canonical content for signing/verification
  async function getNoteCanonicalContent(id: string) {
    const note = await storage.getMedicalNote(id);
    if (!note) return null;
    
    const diagnoses = await storage.getNoteDiagnoses(id);
    
    return JSON.stringify({
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
      diagnosticos: diagnoses.map(d => ({ codigo: d.cie10Codigo, tipo: d.tipoDiagnostico })),
    });
  }

  // Sign Medical Note (NOM-024-SSA3-2012 - Firma electrónica) - Protected
  app.post("/api/notes/:id/sign", isAuthenticated, isMedico, async (req, res) => {
    try {
      const userId = req.session.userId;
      const note = await storage.getMedicalNote(req.params.id);
      
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (note.medicoId !== userId) return res.status(403).json({ error: "Solo el autor de la nota puede firmarla" });
      if (note.firmada) return res.status(400).json({ error: "Note already signed" });
      
      const contentToSign = await getNoteCanonicalContent(req.params.id);
      if (!contentToSign) return res.status(404).json({ error: "Error al reconstruir contenido" });
      
      const hash = createHash("sha256").update(contentToSign).digest("hex");
      const signedNote = await storage.signMedicalNote(req.params.id, userId!, hash);
      
      await storage.createAuditLog({
        userId: userId!,
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

  // Integrity Verification - Admin Only
  app.post("/api/notes/:id/verify", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const note = await storage.getMedicalNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Nota no encontrada" });
      if (!note.firmada || !note.firmaHash) {
        return res.status(400).json({ error: "La nota no ha sido firmada aún" });
      }

      const currentContent = await getNoteCanonicalContent(req.params.id);
      if (!currentContent) return res.status(500).json({ error: "Error al leer contenido" });

      const currentHash = createHash("sha256").update(currentContent).digest("hex");
      const isIntegrityValid = currentHash === note.firmaHash;

      await storage.createAuditLog({
        userId: req.session.userId!,
        accion: "verificar_integridad",
        entidad: "medical_notes",
        entidadId: note.id,
        detalles: JSON.stringify({ valid: isIntegrityValid, originalHash: note.firmaHash, currentHash }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });

      res.json({
        id: note.id,
        firmada: true,
        fechaFirma: note.fechaFirma,
        integridadValida: isIntegrityValid,
        originalHash: note.firmaHash,
        currentHash: currentHash
      });
    } catch (error) {
      console.error("Integrity check error:", error);
      res.status(500).json({ error: "Error en la verificación de integridad" });
    }
  });

  // Establishment Config
  app.get("/api/config/establishment", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getEstablishmentConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener la configuración del consultorio" });
    }
  });

  app.put("/api/config/establishment", isAuthenticated, isMedico, async (req, res) => {
    try {
      const allowed = [
        "tipoEstablecimiento", "nombreEstablecimiento", "domicilio", "ciudad", "estado",
        "codigoPostal", "telefono", "nombreInstitucion", "razonSocial", "rfc",
        "licenciaSanitaria", "responsableSanitario", "cedulaResponsable",
      ];
      const data = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allowed.includes(k))
      );
      const config = await storage.updateEstablishmentConfig(data);
      await storage.createAuditLog({
        userId: req.session.userId!,
        accion: "actualizar",
        entidad: "establishment_config",
        entidadId: null,
        detalles: JSON.stringify({ campos: Object.keys(data) }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar la configuración del establecimiento" });
    }
  });

  // Logo Upload
  const uploadsDir = path.join(process.cwd(), "dist", "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const logoUpload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `logo-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Solo se permiten imágenes PNG o JPG"));
      }
    },
  });

  app.post("/api/config/logo", isAuthenticated, isMedico, logoUpload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
      }
      const logoUrl = `/uploads/${req.file.filename}`;
      await storage.updateLogoUrl(logoUrl);
      await storage.createAuditLog({
        userId: req.session.userId!,
        accion: "actualizar_logo",
        entidad: "establishment_config",
        entidadId: null,
        detalles: JSON.stringify({ logoUrl }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.json({ logoUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al subir el logo" });
    }
  });

  // Clinic Hours
  app.get("/api/config/clinic-hours", isAuthenticated, async (req, res) => {
    try {
      const hours = await storage.getClinicHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching clinic hours:", error);
      res.status(500).json({ error: "Error al obtener los horarios" });
    }
  });

  app.put("/api/config/clinic-hours", isAuthenticated, isMedico, async (req, res) => {
    try {
      const hours = req.body;
      if (!Array.isArray(hours)) {
        return res.status(400).json({ error: "El cuerpo debe ser un array de horarios" });
      }
      const updated = await storage.updateClinicHours(hours);
      await storage.createAuditLog({
        userId: req.session.userId!,
        accion: "actualizar_horarios",
        entidad: "establishment_config",
        entidadId: null,
        detalles: JSON.stringify({ horarios: hours }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating clinic hours:", error);
      res.status(500).json({ error: "Error al guardar los horarios" });
    }
  });

  // =====================
  // FHIR R4 Endpoints
  // =====================

  const FHIR_CONTENT_TYPE = "application/fhir+json";

  // CapabilityStatement
  app.get("/fhir/metadata", isAuthenticated, (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
    res.json(getCapabilityStatement(baseUrl));
  });

  // Patient resource
  app.get("/fhir/Patient/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Patient not found" }] });
      }
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "patients",
        entidadId: patient.id,
        detalles: JSON.stringify({ fhir: true }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(patientToFhir(patient));
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // Patient search
  app.get("/fhir/Patient", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const query = (req.query.name || req.query.identifier || "") as string;
      const patients = query ? await storage.searchPatients(query) : await storage.getPatients();
      const bundle = {
        resourceType: "Bundle",
        type: "searchset",
        total: patients.length,
        entry: patients.map((p) => ({ fullUrl: `Patient/${p.id}`, resource: patientToFhir(p) })),
      };
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(bundle);
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // Practitioner resource
  app.get("/fhir/Practitioner/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Practitioner not found" }] });
      }
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(userToPractitioner(user));
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // Encounter resource (Nota Médica)
  app.get("/fhir/Encounter/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const note = await storage.getMedicalNote(req.params.id);
      if (!note) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Encounter not found" }] });
      }
      const patient = await storage.getPatient(note.patientId);
      if (!patient) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Associated patient not found" }] });
      }
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "medical_notes",
        entidadId: note.id,
        detalles: JSON.stringify({ fhir: true }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(medicalNoteToEncounter(note, patient));
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // Observation resource (Signos Vitales)
  app.get("/fhir/Observation/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const vitals = await storage.getVitalsById(req.params.id);
      if (!vitals) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Observation not found" }] });
      }
      const observations = vitalsToObservations(vitals, vitals.patientId);
      const panel = observations[0];
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(panel);
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // MedicationRequest resource (Receta)
  app.get("/fhir/MedicationRequest/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "MedicationRequest not found" }] });
      }
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(prescriptionToMedicationRequest(prescription, prescription.patientId));
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // ServiceRequest resource (Orden de Laboratorio)
  app.get("/fhir/ServiceRequest/:id", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const order = await storage.getLabOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "ServiceRequest not found" }] });
      }
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(labOrderToServiceRequest(order, order.patientId));
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  // Patient $everything — Bundle completo del expediente
  app.get("/fhir/Patient/:id/\\$everything", isAuthenticated, isMedicoOrEnfermeria, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Patient not found" }] });
      }
      const [notes, vitals, prescriptions, labOrders, consents] = await Promise.all([
        storage.getMedicalNotes(patient.id),
        storage.getVitals(patient.id),
        storage.getPrescriptions(patient.id),
        storage.getLabOrders(patient.id),
        storage.getPatientConsents(patient.id),
      ]);
      await storage.createAuditLog({
        userId: req.session.userId || null,
        accion: "leer",
        entidad: "patients",
        entidadId: patient.id,
        detalles: JSON.stringify({ fhir: true, operacion: "$everything" }),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
        fecha: new Date(),
      });
      res.setHeader("Content-Type", FHIR_CONTENT_TYPE);
      res.json(createPatientBundle(patient, notes, vitals, prescriptions, labOrders, consents));
    } catch (error) {
      res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: "Internal server error" }] });
    }
  });

  return httpServer;
}
