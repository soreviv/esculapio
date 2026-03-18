import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, real, date, time, index, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (doctors, nurses, admin)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("medico"), // medico, enfermera, admin
  nombre: text("nombre").notNull(),
  especialidad: text("especialidad"),
  cedula: text("cedula"),
  totpSecret: text("totp_secret"),       // encrypted TOTP secret
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients (NOM-004-SSA3-2012 compliant)
export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroExpediente: text("numero_expediente").notNull().unique(), // NOM-004: Número de expediente obligatorio
  nombre: text("nombre").notNull(),
  apellidoPaterno: text("apellido_paterno").notNull(),
  apellidoMaterno: text("apellido_materno"),
  curp: text("curp").notNull().unique(), // SENSITIVE
  fechaNacimiento: date("fecha_nacimiento").notNull(),
  sexo: text("sexo").notNull(), // M or F
  grupoSanguineo: text("grupo_sanguineo"),
  telefono: text("telefono"), // SENSITIVE
  email: text("email"), // SENSITIVE
  direccion: text("direccion"), // SENSITIVE
  ocupacion: text("ocupacion"), 
  estadoCivil: text("estado_civil"), 
  escolaridad: text("escolaridad"), 
  religion: text("religion"), 
  lugarNacimiento: text("lugar_nacimiento"), 
  // NOM-004: Antecedentes
  antecedentesHeredoFamiliares: text("antecedentes_heredo_familiares"), 
  antecedentesPersonalesPatologicos: text("antecedentes_personales_patologicos"), 
  antecedentesPersonalesNoPatologicos: text("antecedentes_personales_no_patologicos"), 
  antecedentesGinecoObstetricos: text("antecedentes_gineco_obstetricos"), 
  alergias: text("alergias").array(),
  contactoEmergencia: text("contacto_emergencia"), // SENSITIVE
  telefonoEmergencia: text("telefono_emergencia"), // SENSITIVE
  status: text("status").notNull().default("activo"), 
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_patients_nombre").on(table.nombre),
  index("idx_patients_apellido_paterno").on(table.apellidoPaterno),
  index("idx_patients_status").on(table.status),
]);

// Medical Notes (NOM-004-SSA3-2012 compliant)
export const medicalNotes = pgTable("medical_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  medicoId: uuid("medico_id").notNull().references(() => users.id),
  tipo: text("tipo").notNull(), 
  fecha: timestamp("fecha").notNull().defaultNow(),
  hora: time("hora"), 
  motivoConsulta: text("motivo_consulta"),
  padecimientoActual: text("padecimiento_actual"), 
  habitusExterior: text("habitus_exterior"), 
  exploracionFisica: text("exploracion_fisica"), 
  signosVitalesTexto: text("signos_vitales_texto"), 
  // SOAP format
  subjetivo: text("subjetivo"),
  objetivo: text("objetivo"),
  analisis: text("analisis"),
  plan: text("plan"),
  pronostico: text("pronostico"), 
  indicacionTerapeutica: text("indicacion_terapeutica"), 
  planEstudios: text("plan_estudios"), 
  // Campos para notas quirúrgicas
  diagnosticoPreoperatorio: text("diagnostico_preoperatorio"),
  operacionPlaneada: text("operacion_planeada"),
  operacionRealizada: text("operacion_realizada"),
  diagnosticoPostoperatorio: text("diagnostico_postoperatorio"),
  descripcionTecnicaQuirurgica: text("descripcion_tecnica_quirurgica"),
  hallazgosTransoperatorios: text("hallazgos_transoperatorios"),
  complicaciones: text("complicaciones"),
  sangradoAproximado: text("sangrado_aproximado"),
  // Firma electrónica
  firmada: boolean("firmada").notNull().default(false),
  firmaHash: text("firma_hash"), 
  fechaFirma: timestamp("fecha_firma"), 
  firmaUserId: uuid("firma_user_id").references(() => users.id), 
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("medical_notes_patient_id_idx").on(table.patientId),
  fechaIdx: index("idx_medical_notes_fecha").on(table.fecha.desc()),
}));

// Medical Note Addendums (Anexos - NOM-024 Requirement)
export const medicalNoteAddendums = pgTable("medical_note_addendums", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalNoteId: uuid("original_note_id").notNull().references(() => medicalNotes.id),
  medicoId: uuid("medico_id").notNull().references(() => users.id),
  contenido: text("contenido").notNull(),
  fecha: timestamp("fecha").notNull().defaultNow(),
  firmaHash: text("firma_hash"),
  fechaFirma: timestamp("fecha_firma"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CIE-10 Catalog
export const cie10Catalog = pgTable("cie10_catalog", {
  codigo: varchar("codigo").primaryKey(),
  descripcion: text("descripcion").notNull(),
  categoria: text("categoria"),
});

// Junction table for Medical Note Diagnoses (Relational approach for CIE-10)
export const medicalNoteDiagnoses = pgTable("medical_note_diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull().references(() => medicalNotes.id),
  cie10Codigo: varchar("cie10_codigo").notNull().references(() => cie10Catalog.codigo),
  tipoDiagnostico: text("tipo_diagnostico").default("presuntivo"), // presuntivo, definitivo
  createdAt: timestamp("created_at").defaultNow(),
});

// Vitals
export const vitals = pgTable("vitals", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  registradoPorId: uuid("registrado_por_id").references(() => users.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  presionSistolica: integer("presion_sistolica"),
  presionDiastolica: integer("presion_diastolica"),
  frecuenciaCardiaca: integer("frecuencia_cardiaca"),
  frecuenciaRespiratoria: integer("frecuencia_respiratoria"),
  temperatura: real("temperatura"),
  saturacionOxigeno: integer("saturacion_oxigeno"),
  peso: real("peso"),
  talla: integer("talla"),
  glucosa: integer("glucosa"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("vitals_patient_id_idx").on(table.patientId),
  fechaIdx: index("idx_vitals_fecha").on(table.fecha.desc()),
}));

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  recetaId: uuid("receta_id"),                         // groups multiple meds under one receta
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  medicoId: uuid("medico_id").notNull().references(() => users.id),
  medicamento: text("medicamento").notNull(),
  presentacion: text("presentacion"),
  dosis: text("dosis").notNull(),
  via: text("via").notNull(),
  frecuencia: text("frecuencia").notNull(),
  duracion: text("duracion"),
  indicaciones: text("indicaciones"),
  instruccionesGenerales: text("instrucciones_generales"), // shared instructions for the whole receta
  status: text("status").notNull().default("activa"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("prescriptions_patient_id_idx").on(table.patientId),
  recetaIdIdx: index("prescriptions_receta_id_idx").on(table.recetaId),
}));

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  accion: text("accion").notNull(), 
  entidad: text("entidad").notNull(), 
  entidadId: uuid("entidad_id"),
  detalles: text("detalles"), 
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  fecha: timestamp("fecha").notNull().defaultNow(),
}, (table) => ({
  fechaIdx: index("idx_audit_logs_fecha").on(table.fecha.desc()),
}));

// Patient Consent Records
export const patientConsents = pgTable("patient_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  medicoId: uuid("medico_id").references(() => users.id),
  tipoConsentimiento: text("tipo_consentimiento").notNull(), 
  version: text("version").notNull(),
  procedimiento: text("procedimiento"), 
  riesgos: text("riesgos"), 
  beneficios: text("beneficios"), 
  alternativas: text("alternativas"), 
  autorizaContingencias: boolean("autoriza_contingencias").default(true), 
  nombreFirmante: text("nombre_firmante"), 
  parentescoRepresentante: text("parentesco_representante"), 
  nombreTestigo1: text("nombre_testigo_1"), 
  nombreTestigo2: text("nombre_testigo_2"), 
  aceptado: boolean("aceptado").notNull().default(false),
  fechaAceptacion: timestamp("fecha_aceptacion"),
  lugarFirma: text("lugar_firma"), 
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("patient_consents_patient_id_idx").on(table.patientId),
}));

// Appointments
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  medicoId: uuid("medico_id").notNull().references(() => users.id),
  fecha: date("fecha").notNull(),
  hora: time("hora").notNull(),
  duracion: text("duracion").notNull().default("30 min"),
  motivo: text("motivo"),
  status: text("status").notNull().default("pendiente"), 
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
}));

// Lab Orders
export const labOrders = pgTable("lab_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  medicoId: uuid("medico_id").notNull().references(() => users.id),
  estudios: text("estudios").array().notNull(), 
  diagnosticoPresuntivo: text("diagnostico_presuntivo"),
  indicacionesClinicas: text("indicaciones_clinicas"),
  urgente: boolean("urgente").notNull().default(false),
  ayuno: boolean("ayuno").notNull().default(false),
  status: text("status").notNull().default("pendiente"), 
  resultados: text("resultados"),
  fechaResultados: timestamp("fecha_resultados"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("lab_orders_patient_id_idx").on(table.patientId),
}));

// Nursing Notes
export const nursingNotes = pgTable("nursing_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  enfermeraId: uuid("enfermera_id").notNull().references(() => users.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  turno: text("turno").notNull(), 
  habitusExterior: text("habitus_exterior"), 
  signosVitalesId: uuid("signos_vitales_id").references(() => vitals.id), 
  medicamentosMinistrados: text("medicamentos_ministrados"), 
  procedimientosRealizados: text("procedimientos_realizados"),
  observaciones: text("observaciones"),
  firmada: boolean("firmada").notNull().default(false),
  fechaFirma: timestamp("fecha_firma"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("nursing_notes_patient_id_idx").on(table.patientId),
  fechaIdx: index("idx_nursing_notes_fecha").on(table.fecha.desc()),
}));

// Establishment Configuration
export const establishmentConfig = pgTable("establishment_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipoEstablecimiento: text("tipo_establecimiento").notNull(), 
  nombreEstablecimiento: text("nombre_establecimiento").notNull(),
  domicilio: text("domicilio").notNull(),
  ciudad: text("ciudad").notNull(),
  estado: text("estado").notNull(),
  codigoPostal: text("codigo_postal"),
  telefono: text("telefono"),
  nombreInstitucion: text("nombre_institucion"), 
  razonSocial: text("razon_social"), 
  rfc: text("rfc"),
  licenciaSanitaria: text("licencia_sanitaria"),
  responsableSanitario: text("responsable_sanitario"),
  cedulaResponsable: text("cedula_responsable"),
  logoUrl: text("logo_url"),
  horarios: jsonb("horarios"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas and types
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertMedicalNoteSchema = createInsertSchema(medicalNotes)
  .omit({ id: true, createdAt: true })
  .extend({ fecha: z.coerce.date().optional() });
export const insertMedicalNoteAddendumSchema = createInsertSchema(medicalNoteAddendums).omit({ id: true, createdAt: true });
export const insertMedicalNoteDiagnosisSchema = createInsertSchema(medicalNoteDiagnoses).omit({ id: true, createdAt: true });
export const insertVitalsSchema = createInsertSchema(vitals).omit({ id: true, createdAt: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true });
export const insertCie10Schema = createInsertSchema(cie10Catalog);
export const insertPatientConsentSchema = createInsertSchema(patientConsents).omit({ id: true, createdAt: true });
export const insertLabOrderSchema = createInsertSchema(labOrders).omit({ id: true, createdAt: true });
export const insertNursingNoteSchema = createInsertSchema(nursingNotes).omit({ id: true, createdAt: true });
export const insertEstablishmentConfigSchema = createInsertSchema(establishmentConfig).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertMedicalNote = z.infer<typeof insertMedicalNoteSchema>;
export type MedicalNote = typeof medicalNotes.$inferSelect;
export type InsertMedicalNoteAddendum = z.infer<typeof insertMedicalNoteAddendumSchema>;
export type MedicalNoteAddendum = typeof medicalNoteAddendums.$inferSelect;
export type InsertMedicalNoteDiagnosis = z.infer<typeof insertMedicalNoteDiagnosisSchema>;
export type MedicalNoteDiagnosis = typeof medicalNoteDiagnoses.$inferSelect;
export type InsertVitals = z.infer<typeof insertVitalsSchema>;
export type Vitals = typeof vitals.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertCie10 = z.infer<typeof insertCie10Schema>;
export type Cie10 = typeof cie10Catalog.$inferSelect;
export type InsertPatientConsent = z.infer<typeof insertPatientConsentSchema>;
export type PatientConsent = typeof patientConsents.$inferSelect;
export type InsertLabOrder = z.infer<typeof insertLabOrderSchema>;
export type LabOrder = typeof labOrders.$inferSelect;
export type InsertNursingNote = z.infer<typeof insertNursingNoteSchema>;
export type NursingNote = typeof nursingNotes.$inferSelect;
export type InsertEstablishmentConfig = z.infer<typeof insertEstablishmentConfigSchema>;
export type EstablishmentConfig = typeof establishmentConfig.$inferSelect;

export interface ClinicHoursDay {
  dia: string;
  activo: boolean;
  inicio: string;
  fin: string;
}

export const DEFAULT_CLINIC_HOURS: ClinicHoursDay[] = [
  { dia: "Lunes",     activo: true,  inicio: "08:00", fin: "20:00" },
  { dia: "Martes",    activo: true,  inicio: "08:00", fin: "20:00" },
  { dia: "Miércoles", activo: true,  inicio: "08:00", fin: "20:00" },
  { dia: "Jueves",    activo: true,  inicio: "08:00", fin: "20:00" },
  { dia: "Viernes",   activo: true,  inicio: "08:00", fin: "20:00" },
  { dia: "Sábado",    activo: true,  inicio: "09:00", fin: "14:00" },
  { dia: "Domingo",   activo: false, inicio: "",      fin: ""      },
];

// Enriched types with joined data
export type AppointmentWithDetails = Appointment & {
  patientNombre: string;
  patientApellido: string;
  medicoNombre: string;
  medicoEspecialidad?: string | null;
};

export type MedicalNoteWithDetails = MedicalNote & {
  medicoNombre: string;
  medicoEspecialidad?: string | null;
  diagnosticos?: { codigo: string; descripcion: string; tipo: string }[];
  anexos?: MedicalNoteAddendum[];
};

export type PrescriptionWithDetails = Prescription & {
  medicoNombre: string;
};

export type LabOrderWithDetails = LabOrder & {
  patientNombre: string;
  patientApellido: string;
  medicoNombre: string;
};

// Dashboard metrics types
export type DashboardMetrics = {
  totalPacientes: number;
  pacientesActivos: number;
  citasHoy: number;
  citasPendientes: number;
  citasCompletadas: number;
  notasMedicasHoy: number;
  prescripcionesActivas: number;
  citasPorDia: { fecha: string; total: number }[];
  citasPorEstado: { estado: string; total: number }[];
  pacientesPorMes: { mes: string; total: number }[];
};

// Advanced search filter types
export type PatientSearchFilters = {
  query?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  diagnostico?: string;
  medicoId?: string;
  status?: string;
};

// Patient timeline event type
export type TimelineEvent = {
  id: string;
  tipo: 'nota_medica' | 'vitales' | 'receta' | 'cita' | 'orden_laboratorio';
  fecha: Date;
  titulo: string;
  descripcion?: string;
  medicoNombre?: string;
  detalles: Record<string, unknown>;
};
