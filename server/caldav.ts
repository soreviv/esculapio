import type { Appointment } from "@shared/schema";

const CALDAV_URL = process.env.CALDAV_URL ?? "http://127.0.0.1:5232";
const CALDAV_USER = process.env.CALDAV_USER ?? "";
const CALDAV_PASSWORD = process.env.CALDAV_PASSWORD ?? "";
const CALDAV_CALENDAR = process.env.CALDAV_CALENDAR ?? "consultorio";

function toISODateTime(fecha: string, hora: string): string {
  // fecha: "YYYY-MM-DD", hora: "HH:MM" or "HH:MM:SS"
  const time = hora.length === 5 ? `${hora}:00` : hora;
  return `${fecha}T${time}`.replace(/-|:/g, "").slice(0, 15);
}

function parseDuration(duracion: string): number {
  const match = duracion.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

function addMinutes(fecha: string, hora: string, minutes: number): string {
  const time = hora.length === 5 ? `${hora}:00` : hora;
  const dt = new Date(`${fecha}T${time}`);
  dt.setMinutes(dt.getMinutes() + minutes);
  return dt.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

function buildICS(appointment: Appointment & { patientName?: string | null }): string {
  const uid = appointment.id;
  const dtstart = toISODateTime(appointment.fecha, appointment.hora);
  const dtend = addMinutes(appointment.fecha, appointment.hora, parseDuration(appointment.duracion));
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const summary = appointment.patientName
    ? `Cita: ${appointment.patientName}`
    : `Cita médica`;
  const description = appointment.motivo ? `DESCRIPTION:${appointment.motivo}\r\n` : "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Esculapio EHR//ES",
    "BEGIN:VEVENT",
    `UID:${uid}@esculapio`,
    `DTSTAMP:${now}Z`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    description.trimEnd(),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

const authHeader = `Basic ${Buffer.from(`${CALDAV_USER}:${CALDAV_PASSWORD}`).toString("base64")}`;

export async function createCalDAVEvent(appointment: Appointment & { patientName?: string | null }): Promise<void> {
  if (!CALDAV_USER || !CALDAV_PASSWORD) return;

  const url = `${CALDAV_URL}/${CALDAV_USER}/${CALDAV_CALENDAR}/${appointment.id}.ics`;
  const ics = buildICS(appointment);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
      "Content-Type": "text/calendar; charset=utf-8",
    },
    body: ics,
  });

  if (!res.ok && res.status !== 201 && res.status !== 204) {
    throw new Error(`CalDAV PUT failed: ${res.status} ${res.statusText}`);
  }
}

export async function deleteCalDAVEvent(appointmentId: string): Promise<void> {
  if (!CALDAV_USER || !CALDAV_PASSWORD) return;

  const url = `${CALDAV_URL}/${CALDAV_USER}/${CALDAV_CALENDAR}/${appointmentId}.ics`;

  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: authHeader },
  }).catch(() => {
    // silently ignore if event doesn't exist
  });
}
