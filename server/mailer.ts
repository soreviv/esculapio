import { BrevoClient } from "@getbrevo/brevo";
import type { PortalSettings } from "@shared/schema";

let _client: BrevoClient | null = null;

function getClient(): BrevoClient {
  if (_client) return _client;

  if (!process.env.BREVO_API_KEY) {
    throw new Error("Configuración de correo incompleta. Variable faltante: BREVO_API_KEY");
  }

  _client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  return _client;
}

// ─── Branding helpers ─────────────────────────────────────────────────────────

function clinicName(ps: PortalSettings): string {
  return ps.portalTitle ?? ps.nombreEstablecimiento ?? "Salud Digital";
}

function senderFor(ps: PortalSettings) {
  return {
    name: clinicName(ps),
    email: ps.notificationEmail ?? process.env.SMTP_FROM ?? "contacto@viveros.click",
  };
}

function portalBaseUrl(tenantSlug: string): string {
  const base = process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}`;
  return `${base}/p/${tenantSlug}`;
}

// ─── Shared HTML layout ───────────────────────────────────────────────────────

function emailLayout(content: string, ps: PortalSettings): string {
  const name = clinicName(ps);
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <div style="background:#2563eb;padding:20px 24px;border-radius:8px 8px 0 0">
        ${ps.logoUrl ? `<img src="${ps.logoUrl}" alt="${name}" style="height:40px;object-fit:contain;display:block"/>` : `<p style="color:#fff;font-weight:700;font-size:1.25em;margin:0">${name}</p>`}
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        ${content}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:0.75em;margin:0">
          ${name} — ${ps.domicilio ?? ""} ${ps.ciudad ?? ""}${ps.estado ? ", " + ps.estado : ""}
        </p>
      </div>
    </div>
  `.trim();
}

export async function sendPasswordResetEmail(
  toEmail: string,
  toNombre: string,
  plainToken: string,
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const baseUrl = process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}`;
  const resetUrl = `${baseUrl}/reset-password?token=${plainToken}`;

  const client = getClient();

  await client.transactionalEmails.sendTransacEmail({
    sender: { name: "Salud Digital", email: process.env.SMTP_FROM ?? "contacto@viveros.click" },
    to: [{ email: toEmail, name: toNombre }],
    subject: "Restablecimiento de contraseña — Salud Digital",
    textContent: [
      `Estimado/a ${toNombre},`,
      "",
      "Recibimos una solicitud para restablecer la contraseña de su cuenta en Salud Digital.",
      "",
      "Use el siguiente enlace para crear una nueva contraseña (válido por 1 hora):",
      resetUrl,
      "",
      "Si usted no realizó esta solicitud, ignore este correo. Su contraseña actual no será modificada.",
      "",
      "Salud Digital — Sistema de Expediente Clínico Electrónico",
    ].join("\n"),
    htmlContent: `
      <p>Estimado/a <strong>${toNombre}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de su cuenta en <strong>Salud Digital</strong>.</p>
      <p>
        <a href="${resetUrl}" style="
          display:inline-block;
          padding:12px 24px;
          background:#2563eb;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
          font-weight:600;
        ">Restablecer contraseña</a>
      </p>
      <p style="color:#666;font-size:0.875em">Este enlace expira en <strong>1 hora</strong>.</p>
      <p style="color:#666;font-size:0.875em">
        Si el botón no funciona, copie y pegue esta URL en su navegador:<br/>
        <code>${resetUrl}</code>
      </p>
      <hr/>
      <p style="color:#999;font-size:0.75em">
        Si usted no realizó esta solicitud, ignore este correo.
        Este es un mensaje automático del Sistema de Expediente Clínico Electrónico.
      </p>
    `,
  });
}

// ─── Portal: appointment confirmation to patient ──────────────────────────────

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  fecha: string;       // ISO date string e.g. "2026-04-10"
  hora: string;        // e.g. "10:30"
  appointmentType: string; // "primera_vez" | "subsecuente" | "urgencia"
  actionToken: string;
  tenantSlug: string;
  motivo?: string | null;
}

const APPOINTMENT_TYPE_LABEL: Record<string, string> = {
  primera_vez: "Primera vez",
  subsecuente: "Consulta de seguimiento",
  urgencia: "Urgencia",
};

export async function sendAppointmentConfirmationToPatient(
  data: AppointmentEmailData,
  ps: PortalSettings,
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const base = portalBaseUrl(data.tenantSlug);
  const confirmUrl = `${base}/cita/confirmar?token=${data.actionToken}`;
  const cancelUrl  = `${base}/cita/cancelar?token=${data.actionToken}`;
  const typeLabel  = APPOINTMENT_TYPE_LABEL[data.appointmentType] ?? data.appointmentType;
  const dateFormatted = new Date(data.fecha + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const content = `
    <p>Estimado/a <strong>${data.patientName}</strong>,</p>
    <p>Su solicitud de cita ha sido recibida. Los detalles son:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:40%">Tipo de consulta</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${typeLabel}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Fecha</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Hora</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.hora}</td></tr>
      ${ps.domicilio ? `<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Lugar</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${ps.domicilio}, ${ps.ciudad ?? ""}</td></tr>` : ""}
      ${ps.consultationFee ? `<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Costo</td><td style="padding:8px 12px;border:1px solid #e5e7eb">$${ps.consultationFee} MXN</td></tr>` : ""}
    </table>
    <p>Por favor confirme su asistencia:</p>
    <p>
      <a href="${confirmUrl}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin-right:12px">Confirmar cita</a>
      <a href="${cancelUrl}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Cancelar cita</a>
    </p>
    <p style="color:#6b7280;font-size:0.875em">Si tiene dudas llámenos al ${ps.telefono ?? "consultorio"}.</p>
  `;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: senderFor(ps),
    to: [{ email: data.patientEmail, name: data.patientName }],
    subject: `Cita agendada — ${dateFormatted} a las ${data.hora}`,
    htmlContent: emailLayout(content, ps),
    textContent: `Cita agendada: ${typeLabel} el ${dateFormatted} a las ${data.hora}.\nConfirmar: ${confirmUrl}\nCancelar: ${cancelUrl}`,
  });
}

// ─── Portal: new booking notification to doctor ───────────────────────────────

export async function sendAppointmentNotificationToDoctor(
  data: AppointmentEmailData,
  ps: PortalSettings,
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const notifEmail = ps.notificationEmail;
  if (!notifEmail) return; // not configured

  const typeLabel = APPOINTMENT_TYPE_LABEL[data.appointmentType] ?? data.appointmentType;
  const dateFormatted = new Date(data.fecha + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const content = `
    <p>Se ha recibido una nueva solicitud de cita a través del portal.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:40%">Paciente</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.patientName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Tipo</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${typeLabel}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Fecha</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Hora</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.hora}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Email</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.patientEmail}</td></tr>
      ${data.motivo ? `<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Motivo</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.motivo}</td></tr>` : ""}
    </table>
    <p style="color:#6b7280;font-size:0.875em">Revise su agenda en el sistema EHR para confirmar o reagendar.</p>
  `;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: senderFor(ps),
    to: [{ email: notifEmail, name: clinicName(ps) }],
    subject: `Nueva cita portal — ${data.patientName} el ${dateFormatted}`,
    htmlContent: emailLayout(content, ps),
    textContent: `Nueva cita portal: ${data.patientName}, ${typeLabel}, ${dateFormatted} ${data.hora}. Email: ${data.patientEmail}`,
  });
}

// ─── Portal: appointment cancellation ────────────────────────────────────────

export async function sendAppointmentCancellation(
  data: Pick<AppointmentEmailData, "patientName" | "patientEmail" | "fecha" | "hora" | "tenantSlug">,
  ps: PortalSettings,
  cancelledBy: "patient" | "clinic",
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const dateFormatted = new Date(data.fecha + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const base = portalBaseUrl(data.tenantSlug);

  const reason = cancelledBy === "clinic"
    ? "El consultorio ha cancelado su cita. Puede agendar una nueva desde el portal."
    : "Su cita ha sido cancelada correctamente.";

  const content = `
    <p>Estimado/a <strong>${data.patientName}</strong>,</p>
    <p>${reason}</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:40%">Fecha cancelada</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Hora</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.hora}</td></tr>
    </table>
    <p>
      <a href="${base}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Agendar nueva cita</a>
    </p>
    <p style="color:#6b7280;font-size:0.875em">Si tiene preguntas contáctenos al ${ps.telefono ?? "consultorio"}.</p>
  `;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: senderFor(ps),
    to: [{ email: data.patientEmail, name: data.patientName }],
    subject: `Cita cancelada — ${clinicName(ps)}`,
    htmlContent: emailLayout(content, ps),
    textContent: `${reason} Cita cancelada: ${dateFormatted} ${data.hora}.`,
  });
}

// ─── Portal: contact form notification to doctor ─────────────────────────────

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  messageId: string;
}

export async function sendContactNotification(
  data: ContactEmailData,
  ps: PortalSettings,
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const notifEmail = ps.notificationEmail;
  if (!notifEmail) return;

  const content = `
    <p>Ha recibido un nuevo mensaje de contacto a través del portal.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:30%">Nombre</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.name}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Correo</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.email}</td></tr>
      ${data.phone ? `<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Teléfono</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.phone}</td></tr>` : ""}
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Asunto</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.subject}</td></tr>
    </table>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0;white-space:pre-wrap">${data.message}</div>
    <p style="color:#6b7280;font-size:0.875em">Responda directamente a ${data.email} o desde la bandeja de mensajes en el EHR.</p>
  `;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: senderFor(ps),
    to: [{ email: notifEmail, name: clinicName(ps) }],
    replyTo: { email: data.email, name: data.name },
    subject: `Nuevo mensaje: ${data.subject}`,
    htmlContent: emailLayout(content, ps),
    textContent: `Nuevo mensaje de ${data.name} (${data.email}):\n\nAsunto: ${data.subject}\n\n${data.message}`,
  });
}

// ─── Portal: appointment reschedule confirmation to patient ───────────────────

export async function sendAppointmentReschedule(
  data: AppointmentEmailData,
  ps: PortalSettings,
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const base = portalBaseUrl(data.tenantSlug);
  const confirmUrl = `${base}/cita/confirmar?token=${data.actionToken}`;
  const cancelUrl  = `${base}/cita/cancelar?token=${data.actionToken}`;
  const typeLabel  = APPOINTMENT_TYPE_LABEL[data.appointmentType] ?? data.appointmentType;
  const dateFormatted = new Date(data.fecha + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const content = `
    <p>Estimado/a <strong>${data.patientName}</strong>,</p>
    <p>Su cita ha sido <strong>reagendada</strong> exitosamente. Los nuevos detalles son:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:40%">Tipo de consulta</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${typeLabel}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Nueva fecha</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
      <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Nueva hora</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${data.hora}</td></tr>
      ${ps.domicilio ? `<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Lugar</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${ps.domicilio}, ${ps.ciudad ?? ""}</td></tr>` : ""}
      ${ps.consultationFee ? `<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600">Costo</td><td style="padding:8px 12px;border:1px solid #e5e7eb">$${ps.consultationFee} MXN</td></tr>` : ""}
    </table>
    <p>Confirme su asistencia a la nueva cita:</p>
    <p>
      <a href="${confirmUrl}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin-right:12px">Confirmar cita</a>
      <a href="${cancelUrl}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Cancelar cita</a>
    </p>
    <p style="color:#6b7280;font-size:0.875em">Si tiene dudas llámenos al ${ps.telefono ?? "consultorio"}.</p>
  `;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: senderFor(ps),
    to: [{ email: data.patientEmail, name: data.patientName }],
    subject: `Cita reagendada — ${dateFormatted} a las ${data.hora}`,
    htmlContent: emailLayout(content, ps),
    textContent: `Cita reagendada: ${typeLabel} el ${dateFormatted} a las ${data.hora}.\nConfirmar: ${confirmUrl}\nCancelar: ${cancelUrl}`,
  });
}

// ─── Portal: reply from doctor to patient ────────────────────────────────────

export async function sendContactReply(
  originalData: Pick<ContactEmailData, "name" | "email" | "subject">,
  replyBody: string,
  ps: PortalSettings,
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;

  const content = `
    <p>Estimado/a <strong>${originalData.name}</strong>,</p>
    <p>El equipo de <strong>${clinicName(ps)}</strong> ha respondido a su mensaje "<em>${originalData.subject}</em>":</p>
    <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;margin:16px 0;white-space:pre-wrap">${replyBody}</div>
    <p style="color:#6b7280;font-size:0.875em">Si tiene más preguntas no dude en contactarnos.</p>
  `;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: senderFor(ps),
    to: [{ email: originalData.email, name: originalData.name }],
    subject: `Re: ${originalData.subject} — ${clinicName(ps)}`,
    htmlContent: emailLayout(content, ps),
    textContent: `Respuesta a su mensaje "${originalData.subject}":\n\n${replyBody}`,
  });
}
