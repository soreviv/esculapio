
const SENSITIVE_PATHS = [
  "/api/patients",
  "/api/notes",
  "/api/vitals",
  "/api/prescriptions",
  "/api/lab-orders",
  "/api/consents",
  "/api/appointments",
  "/api/audit-logs",
  "/fhir",
];

export function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some(p => path.startsWith(p));
}

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /curp/i,
  /telefono/i,
  /direccion/i,
  /email/i,
  /diagnostico/i,
  /plan$/i,
  /subjetivo/i,
  /objetivo/i,
  /analisis/i,
  /medicamento/i,
  /indicaciones/i,
  /estudios/i,
  /observaciones/i,
  /cedula/i,
  /nombre/i,
  /apellido/i,
  /fechanacimiento/i,
  /sexo/i,
  /tiposangre/i,
  /alergias/i,
  /antecedentes/i,
  /contactoemergencia/i,
  /detalles/i,
];

export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

export function redactSensitiveData(data: any, depth: number = 0): any {
  if (depth > 10) return "[MAX_DEPTH]";
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, depth + 1));
  }

  const redacted: Record<string, any> = {};

  for (const key of Object.keys(data)) {
    if (isSensitiveField(key)) {
      redacted[key] = "[REDACTED]";
    } else if (typeof data[key] === "object" && data[key] !== null) {
      redacted[key] = redactSensitiveData(data[key], depth + 1);
    } else {
      redacted[key] = data[key];
    }
  }

  return redacted;
}
