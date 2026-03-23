import { BrevoClient } from "@getbrevo/brevo";

let _client: BrevoClient | null = null;

function getClient(): BrevoClient {
  if (_client) return _client;

  if (!process.env.BREVO_API_KEY) {
    throw new Error("Configuración de correo incompleta. Variable faltante: BREVO_API_KEY");
  }

  _client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  return _client;
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
