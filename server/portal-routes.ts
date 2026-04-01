/**
 * Public Portal API Routes — /p/:slug/api/*
 *
 * These routes are unauthenticated and expose only what a patient needs:
 *   GET  /p/:slug/api/portal-info          — public clinic info + portal config
 *   GET  /p/:slug/api/slots?fecha=YYYY-MM-DD — available booking slots for a date
 *   POST /p/:slug/api/appointments          — create a portal appointment
 *   GET  /p/:slug/api/appointments/confirm?token=UUID — confirm via email link
 *   GET  /p/:slug/api/appointments/cancel?token=UUID  — cancel via email link
 *   POST /p/:slug/api/contact               — submit contact form
 *   POST /p/:slug/api/chat                  — AI chatbot (Gemini)
 *
 * Tenant resolution is handled by the global resolveTenant middleware registered in index.ts.
 * Each route calls createTenantStorage(req.tenantId) to scope DB access.
 */

import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createTenantStorage } from "./storage";
import { decrypt } from "./crypto";
import {
  sendAppointmentConfirmationToPatient,
  sendAppointmentNotificationToDoctor,
  sendAppointmentCancellation,
  sendAppointmentReschedule,
  sendContactNotification,
} from "./mailer";
import type { PortalSettings, ClinicHoursDay } from "@shared/schema";
import { DEFAULT_CLINIC_HOURS } from "@shared/schema";

// ─── Rate limiters ─────────────────────────────────────────────────────────────

const portalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Demasiadas solicitudes, intente de nuevo más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: "Demasiadas solicitudes de cita, intente más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "Lunes" | "Martes" … for a given Date */
const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function dayNameEs(date: Date): string {
  return DAY_NAMES_ES[date.getDay()];
}

/** Generates HH:MM time slots between inicio and fin, stepping by slotMin + bufferMin */
function generateSlots(inicio: string, fin: string, slotMin: number, bufferMin: number): string[] {
  const [sh, sm] = inicio.split(":").map(Number);
  const [eh, em] = fin.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin   = eh * 60 + em;
  const step     = slotMin + bufferMin;

  const slots: string[] = [];
  for (let t = startMin; t + slotMin <= endMin; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

/** Strip sensitive fields before returning portal_settings to public clients */
function publicPortalInfo(ps: PortalSettings) {
  const { geminiApiKeyEncrypted, hcaptchaSecretKey, ...rest } = ps;
  return {
    ...rest,
    chatEnabled: !!geminiApiKeyEncrypted, // expose boolean, not the encrypted key
  };
}

/** Resolves tenantId or returns 404 */
function requirePortalTenant(req: Request, res: Response): string | null {
  const tenantId = (req as any).tenantId as string | undefined;
  if (!tenantId) {
    res.status(404).json({ error: "Portal no encontrado" });
    return null;
  }
  return tenantId;
}

/** Validates portal is enabled on the settings row */
function requirePortalEnabled(ps: PortalSettings | undefined, res: Response): ps is PortalSettings {
  if (!ps) {
    res.status(404).json({ error: "Portal no configurado" });
    return false;
  }
  if (!ps.portalEnabled) {
    res.status(403).json({ error: "El portal de este consultorio no está activo" });
    return false;
  }
  return true;
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerPortalRoutes(app: Express): void {

  app.use("/p/:slug/api", portalLimiter);

  // ── GET /p/:slug/api/portal-info ──────────────────────────────────────────

  app.get("/p/:slug/api/portal-info", async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      res.json(publicPortalInfo(ps));
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── GET /p/:slug/api/slots?fecha=YYYY-MM-DD ────────────────────────────────

  app.get("/p/:slug/api/slots", async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const fecha = req.query.fecha as string;
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ error: "Parámetro 'fecha' requerido (YYYY-MM-DD)" });
      }

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      // Check advance booking window
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(fecha + "T00:00:00");
      const advanceDays = ps.bookingAdvanceDays ?? 30;
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + advanceDays);

      if (target < today) {
        return res.json({ slots: [], reason: "fecha_pasada" });
      }
      if (target > maxDate) {
        return res.json({ slots: [], reason: "fuera_de_ventana" });
      }

      // Check if holiday
      const holidays = ps.diasFeriados ?? [];
      if (holidays.includes(fecha)) {
        return res.json({ slots: [], reason: "dia_feriado" });
      }

      // Find day schedule
      const horarios: ClinicHoursDay[] = ps.horarios ?? DEFAULT_CLINIC_HOURS;
      const dayName = dayNameEs(target);
      const schedule = horarios.find((d) => d.dia === dayName);

      if (!schedule || !schedule.activo || !schedule.inicio || !schedule.fin) {
        return res.json({ slots: [], reason: "dia_cerrado" });
      }

      // Generate candidate slots
      const slotMin    = ps.appointmentDurationMin ?? 30;
      const bufferMin  = ps.bookingBufferMin ?? 0;
      const allSlots   = generateSlots(schedule.inicio, schedule.fin, slotMin, bufferMin);

      // Remove already-booked slots
      const booked = await ts.getAppointmentsByDate(fecha);
      const bookedTimes = new Set(booked.map((a) => a.hora?.substring(0, 5)));

      // If today, remove past slots (add 60 min buffer)
      const nowMin = today.getTime() === target.getTime()
        ? new Date().getHours() * 60 + new Date().getMinutes() + 60
        : 0;

      const available = allSlots.filter((slot) => {
        if (bookedTimes.has(slot)) return false;
        if (nowMin > 0) {
          const [h, m] = slot.split(":").map(Number);
          if (h * 60 + m <= nowMin) return false;
        }
        return true;
      });

      res.json({ slots: available, fecha, slotDurationMin: slotMin });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── POST /p/:slug/api/appointments ────────────────────────────────────────

  const bookingSchema = z.object({
    patientName:     z.string().min(2).max(120),
    patientPhone:    z.string().min(7).max(20),
    patientEmail:    z.string().email(),
    fecha:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora:            z.string().regex(/^\d{2}:\d{2}$/),
    appointmentType: z.enum(["primera_vez", "subsecuente", "urgencia", "lavado_oidos"]),
    motivo:          z.string().max(500).optional(),
  });

  app.post("/p/:slug/api/appointments", bookingLimiter, async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const parsed = bookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.flatten() });
      }
      const data = parsed.data;

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      // Conflict check
      const booked = await ts.getAppointmentsByDate(data.fecha);
      const conflict = booked.find((a) => a.hora?.substring(0, 5) === data.hora);
      if (conflict) {
        return res.status(409).json({ error: "El horario seleccionado ya no está disponible" });
      }

      const appointment = await ts.createAppointment({
        tenantId,
        bookingSource: "portal",
        patientName:    data.patientName,
        patientPhone:   data.patientPhone,
        patientEmail:   data.patientEmail,
        fecha:          data.fecha,
        hora:           data.hora,
        appointmentType: data.appointmentType,
        motivo:          data.motivo ?? null,
        status:          "programada",
        patientConfirmed: false,
        reminderSent:    false,
      } as any);

      // Send emails (fire-and-forget; don't fail request if email fails)
      const tenantSlug = (req as any).tenantSlug as string ?? req.params.slug;
      const emailData = {
        patientName:     data.patientName,
        patientEmail:    data.patientEmail,
        fecha:           data.fecha,
        hora:            data.hora,
        appointmentType: data.appointmentType,
        actionToken:     appointment.actionToken ?? "",
        tenantSlug,
        motivo:          data.motivo,
      };

      Promise.all([
        sendAppointmentConfirmationToPatient(emailData, ps).catch(() => {}),
        sendAppointmentNotificationToDoctor(emailData, ps).catch(() => {}),
      ]);

      res.status(201).json({
        id:      appointment.id,
        fecha:   appointment.fecha,
        hora:    appointment.hora,
        message: "Cita registrada. Recibirá un correo de confirmación.",
      });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── GET /p/:slug/api/appointments/confirm?token=UUID ──────────────────────

  app.get("/p/:slug/api/appointments/confirm", async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const token = req.query.token as string;
      if (!token) return res.status(400).json({ error: "Token requerido" });

      const ts = createTenantStorage(tenantId);
      const appt = await ts.getAppointmentByActionToken(token);

      if (!appt) return res.status(404).json({ error: "Cita no encontrada o token inválido" });
      if (appt.status === "cancelada") return res.status(410).json({ error: "Esta cita ya fue cancelada" });

      if (!appt.patientConfirmed) {
        await ts.updateAppointment(appt.id, { patientConfirmed: true });
      }

      res.json({ message: "Su cita ha sido confirmada. ¡Hasta pronto!", fecha: appt.fecha, hora: appt.hora });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── GET /p/:slug/api/appointments/cancel?token=UUID ───────────────────────

  app.get("/p/:slug/api/appointments/cancel", async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const token = req.query.token as string;
      if (!token) return res.status(400).json({ error: "Token requerido" });

      const ts = createTenantStorage(tenantId);
      const appt = await ts.getAppointmentByActionToken(token);

      if (!appt) return res.status(404).json({ error: "Cita no encontrada o token inválido" });
      if (appt.status === "cancelada") return res.json({ message: "Esta cita ya fue cancelada anteriormente." });

      await ts.updateAppointment(appt.id, { status: "cancelada" });

      const ps = await ts.getPortalSettings();
      const tenantSlug = (req as any).tenantSlug as string ?? req.params.slug;

      if (ps && appt.patientEmail) {
        sendAppointmentCancellation(
          { patientName: appt.patientName ?? "Paciente", patientEmail: appt.patientEmail, fecha: appt.fecha, hora: appt.hora ?? "", tenantSlug },
          ps,
          "patient",
        ).catch(() => {});
      }

      res.json({ message: "Su cita ha sido cancelada correctamente." });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── POST /p/:slug/api/contact ──────────────────────────────────────────────

  const contactSchema = z.object({
    name:    z.string().min(2).max(120),
    email:   z.string().email(),
    phone:   z.string().max(20).optional(),
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(2000),
  });

  app.post("/p/:slug/api/contact", bookingLimiter, async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.flatten() });
      }
      const data = parsed.data;

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      const msg = await ts.createContactMessage({
        tenantId,
        name:    data.name,
        email:   data.email,
        phone:   data.phone ?? null,
        subject: data.subject,
        message: data.message,
      } as any);

      sendContactNotification({ ...data, messageId: msg.id }, ps).catch(() => {});

      res.status(201).json({ message: "Mensaje recibido. Le responderemos a la brevedad." });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── POST /p/:slug/api/chat ────────────────────────────────────────────────
  // Gemini-powered chatbot — only available if tenant has configured geminiApiKeyEncrypted

  const chatSchema = z.object({
    message:  z.string().min(1).max(500),
    history:  z.array(z.object({
      role:    z.enum(["user", "model"]),
      content: z.string().max(1000),
    })).max(20).optional(),
  });

  app.post("/p/:slug/api/chat", bookingLimiter, async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const parsed = chatSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      if (!ps.geminiApiKeyEncrypted) {
        return res.status(503).json({ error: "El chatbot no está configurado para este consultorio" });
      }

      // Decrypt Gemini API key stored per-tenant
      const geminiApiKey = decrypt(ps.geminiApiKeyEncrypted);

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const clinicInfo = [
        `Eres el asistente virtual del consultorio "${ps.portalTitle ?? ps.nombreEstablecimiento}".`,
        ps.domicilio ? `El consultorio está ubicado en: ${ps.domicilio}, ${ps.ciudad ?? ""}.` : "",
        ps.telefono  ? `Teléfono: ${ps.telefono}.` : "",
        ps.consultationFee ? `El costo de consulta es $${ps.consultationFee} MXN.` : "",
        ps.chatbotInfoExtra ? ps.chatbotInfoExtra : "",
        "Responde únicamente preguntas relacionadas con el consultorio, servicios, horarios y citas.",
        "Si el paciente necesita una cita, indícale que puede agendarla desde el portal.",
        "No des diagnósticos médicos ni consejos de tratamiento.",
      ].filter(Boolean).join(" ");

      const history = (parsed.data.history ?? []).map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      }));

      const chat = model.startChat({
        history,
        systemInstruction: { role: "user", parts: [{ text: clinicInfo }] },
      });

      const result = await chat.sendMessage(parsed.data.message);
      const reply  = result.response.text();

      res.json({ reply });
    } catch {
      res.status(500).json({ error: "Error al procesar la solicitud del chatbot" });
    }
  });

  // ── GET /p/:slug/api/appointments/by-token/:token ─────────────────────────
  // Returns public appointment info by action token (for cancel/reschedule pages)

  app.get("/p/:slug/api/appointments/by-token/:token", async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      const appt = await ts.getAppointmentByActionToken(req.params.token);
      if (!appt) return res.status(404).json({ error: "Cita no encontrada o token inválido" });

      // Return only public fields — no medical details
      res.json({
        id:               appt.id,
        patientName:      appt.patientName,
        fecha:            appt.fecha,
        hora:             appt.hora,
        appointmentType:  appt.appointmentType,
        status:           appt.status,
        patientConfirmed: appt.patientConfirmed,
      });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── POST /p/:slug/api/appointments/reschedule/:token ──────────────────────
  // Cancel existing appointment and create a new one with the same patient info

  const rescheduleSchema = z.object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora:  z.string().regex(/^\d{2}:\d{2}$/),
  });

  app.post("/p/:slug/api/appointments/reschedule/:token", bookingLimiter, async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const parsed = rescheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.flatten() });
      }
      const { fecha, hora } = parsed.data;

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      const appt = await ts.getAppointmentByActionToken(req.params.token);
      if (!appt) return res.status(404).json({ error: "Cita no encontrada o token inválido" });
      if (appt.status === "cancelada") {
        return res.status(409).json({ error: "No se puede reagendar una cita cancelada" });
      }

      // Check new slot is available (excluding current appointment)
      const booked = await ts.getAppointmentsByDate(fecha);
      const conflict = booked.find((a) => a.hora?.substring(0, 5) === hora && a.id !== appt.id);
      if (conflict) {
        return res.status(409).json({ error: "El horario seleccionado no está disponible" });
      }

      // Cancel old, create new with same patient info
      await ts.updateAppointment(appt.id, { status: "cancelada" });

      const newAppt = await ts.createAppointment({
        tenantId,
        bookingSource:    "portal",
        patientName:      appt.patientName,
        patientPhone:     appt.patientPhone,
        patientEmail:     appt.patientEmail,
        fecha,
        hora,
        appointmentType:  appt.appointmentType,
        motivo:           appt.motivo,
        status:           "programada",
        patientConfirmed: false,
        reminderSent:     false,
      } as any);

      // Send reschedule confirmation email (fire-and-forget)
      const tenantSlug = (req as any).tenantSlug as string ?? req.params.slug;
      if (appt.patientEmail && newAppt.actionToken) {
        sendAppointmentReschedule(
          {
            patientName:     appt.patientName ?? "Paciente",
            patientEmail:    appt.patientEmail,
            fecha,
            hora,
            appointmentType: appt.appointmentType ?? "primera_vez",
            actionToken:     newAppt.actionToken,
            tenantSlug,
          },
          ps,
        ).catch(() => {});
      }

      res.status(201).json({
        id:      newAppt.id,
        fecha:   newAppt.fecha,
        hora:    newAppt.hora,
        message: "Cita reagendada exitosamente. Recibirá un correo de confirmación.",
      });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ── POST /p/:slug/api/appointments/confirm-attendance/:token ─────────────
  // Patient confirms they will attend (idempotent)

  app.post("/p/:slug/api/appointments/confirm-attendance/:token", async (req: Request, res: Response) => {
    try {
      const tenantId = requirePortalTenant(req, res);
      if (!tenantId) return;

      const ts = createTenantStorage(tenantId);
      const ps = await ts.getPortalSettings();
      if (!requirePortalEnabled(ps, res)) return;

      const appt = await ts.getAppointmentByActionToken(req.params.token);
      if (!appt) return res.status(404).json({ error: "Cita no encontrada o token inválido" });
      if (appt.status === "cancelada") return res.status(409).json({ error: "Esta cita ya fue cancelada" });

      const alreadyConfirmed = appt.patientConfirmed;
      if (!alreadyConfirmed) {
        await ts.updateAppointment(appt.id, { patientConfirmed: true });
      }

      res.json({
        success:          true,
        alreadyConfirmed,
        fecha:            appt.fecha,
        hora:             appt.hora,
      });
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
}
