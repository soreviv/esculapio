import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, real, date, time, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (doctors, nurses, admin)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("medico"), // medico, enfermera, admin
  nombre: text("nombre").notNull(),
  especialidad: text("especialidad"),
  cedula: text("cedula"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients (NOM-004-SSA3-2012 compliant)
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroExpediente: text("numero_expediente").notNull().unique(), // NOM-004: Número de expediente obligatorio
  nombre: text("nombre").notNull(),
  apellidoPaterno: text("apellido_paterno").notNull(),
  apellidoMaterno: text("apellido_materno"),
  curp: text("curp").notNull().unique(),
  fechaNacimiento: date("fecha_nacimiento").notNull(),
  sexo: text("sexo").notNull(), // M or F
  grupoSanguineo: text("grupo_sanguineo"),
  telefono: text("telefono"),
  email: text("email"),
  direccion: text("direccion"),
  ocupacion: text("ocupacion"), // NOM-004: Ocupación
  estadoCivil: text("estado_civil"), // NOM-004: Estado civil
  escolaridad: text("escolaridad"), // NOM-004: Escolaridad
  religion: text("religion"), // NOM-004: Religión (opcional)
  lugarNacimiento: text("lugar_nacimiento"), // NOM-004: Lugar de nacimiento
  // NOM-004: Antecedentes
  antecedentesHeredoFamiliares: text("antecedentes_heredo_familiares"), // Enfermedades hereditarias familiares
  antecedentesPersonalesPatologicos: text("antecedentes_personales_patologicos"), // Enfermedades previas, cirugías, hospitalizaciones
  antecedentesPersonalesNoPatologicos: text("antecedentes_personales_no_patologicos"), // Hábitos, tabaquismo, alcoholismo, etc.
  antecedentesGinecoObstetricos: text("antecedentes_gineco_obstetricos"), // Para mujeres
  alergias: text("alergias").array(),
  contactoEmergencia: text("contacto_emergencia"),
  telefonoEmergencia: text("telefono_emergencia"),
  status: text("status").notNull().default("activo"), // activo, alta, en_consulta
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical Notes (NOM-004-SSA3-2012 compliant)
export const medicalNotes = pgTable("medical_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  // NOM-004: Tipos de notas médicas
  tipo: text("tipo").notNull(), // historia_clinica, nota_inicial, nota_evolucion, nota_interconsulta, nota_referencia, nota_ingreso, nota_preoperatoria, nota_postoperatoria, nota_preanestesica, nota_egreso
  fecha: timestamp("fecha").notNull().defaultNow(),
  hora: time("hora"), // NOM-004: Hora obligatoria
  // NOM-004: Campos de interrogatorio
  motivoConsulta: text("motivo_consulta"),
  padecimientoActual: text("padecimiento_actual"), // NOM-004: Padecimiento actual
  // NOM-004: Exploración física
  habitusExterior: text("habitus_exterior"), // NOM-004: Habitus exterior
  exploracionFisica: text("exploracion_fisica"), // NOM-004: Exploración por aparatos y sistemas
  signosVitalesTexto: text("signos_vitales_texto"), // NOM-004: Signos vitales en texto
  // SOAP format
  subjetivo: text("subjetivo"),
  objetivo: text("objetivo"),
  analisis: text("analisis"),
  plan: text("plan"),
  // NOM-004: Diagnósticos y pronóstico
  diagnosticos: text("diagnosticos").array(),
  diagnosticosCie10: text("diagnosticos_cie10").array(), // CIE-10 codes
  pronostico: text("pronostico"), // NOM-004: Pronóstico obligatorio
  // NOM-004: Campos específicos por tipo de nota
  indicacionTerapeutica: text("indicacion_terapeutica"), // NOM-004: Indicación terapéutica
  planEstudios: text("plan_estudios"), // NOM-004: Plan de estudios auxiliares
  // Campos para notas quirúrgicas (NOM-004)
  diagnosticoPreoperatorio: text("diagnostico_preoperatorio"),
  operacionPlaneada: text("operacion_planeada"),
  operacionRealizada: text("operacion_realizada"),
  diagnosticoPostoperatorio: text("diagnostico_postoperatorio"),
  descripcionTecnicaQuirurgica: text("descripcion_tecnica_quirurgica"),
  hallazgosTransoperatorios: text("hallazgos_transoperatorios"),
  complicaciones: text("complicaciones"),
  sangradoAproximado: text("sangrado_aproximado"),
  // Campos para nota de egreso (NOM-004)
  fechaIngreso: timestamp("fecha_ingreso"),
  fechaEgreso: timestamp("fecha_egreso"),
  motivoEgreso: text("motivo_egreso"), // mejoria, traslado, defuncion, alta_voluntaria
  diagnosticoFinal: text("diagnostico_final"),
  resumenEvolucion: text("resumen_evolucion"),
  recomendacionesAmbulatorias: text("recomendaciones_ambulatorias"),
  // Firma electrónica (NOM-024)
  firmada: boolean("firmada").notNull().default(false),
  firmaHash: text("firma_hash"), // SHA-256 hash of note content for electronic signature
  fechaFirma: timestamp("fecha_firma"), // Timestamp when signed
  firmaUserId: varchar("firma_user_id").references(() => users.id), // Who signed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("medical_notes_patient_id_idx").on(table.patientId),
}));

// Vitals
export const vitals = pgTable("vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  registradoPorId: varchar("registrado_por_id").references(() => users.id),
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
}));

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  medicamento: text("medicamento").notNull(),
  presentacion: text("presentacion"),
  dosis: text("dosis").notNull(),
  via: text("via").notNull(),
  frecuencia: text("frecuencia").notNull(),
  duracion: text("duracion"),
  indicaciones: text("indicaciones"),
  status: text("status").notNull().default("activa"), // activa, completada, cancelada
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("prescriptions_patient_id_idx").on(table.patientId),
}));

// Audit Logs (NOM-024-SSA3-2012 compliance - trazabilidad)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  accion: text("accion").notNull(), // crear, leer, actualizar, eliminar, firmar, acceso
  entidad: text("entidad").notNull(), // patients, medical_notes, prescriptions, vitals
  entidadId: varchar("entidad_id"),
  detalles: text("detalles"), // JSON with additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  fecha: timestamp("fecha").notNull().defaultNow(),
});

// CIE-10 Catalog (NOM-024-SSA3-2012 compliance - diagnósticos estandarizados)
export const cie10Catalog = pgTable("cie10_catalog", {
  codigo: varchar("codigo").primaryKey(),
  descripcion: text("descripcion").notNull(),
  categoria: text("categoria"),
});

// Patient Consent Records (NOM-004-SSA3-2012 + LFPDPPP compliance)
export const patientConsents = pgTable("patient_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicoId: varchar("medico_id").references(() => users.id), // NOM-004: Médico que informa
  // NOM-004: Tipo de consentimiento informado
  tipoConsentimiento: text("tipo_consentimiento").notNull(), // privacidad, ingreso_hospitalario, cirugia, anestesia, procedimiento_riesgo, investigacion, transfusion, tratamiento_datos
  version: text("version").notNull(),
  // NOM-004: Campos obligatorios de consentimiento informado
  procedimiento: text("procedimiento"), // NOM-004: Descripción del procedimiento autorizado
  riesgos: text("riesgos"), // NOM-004: Riesgos esperados
  beneficios: text("beneficios"), // NOM-004: Beneficios esperados
  alternativas: text("alternativas"), // NOM-004: Alternativas de tratamiento
  autorizaContingencias: boolean("autoriza_contingencias").default(true), // NOM-004: Autorización para atender contingencias
  // NOM-004: Datos del firmante
  nombreFirmante: text("nombre_firmante"), // NOM-004: Nombre de quien firma (paciente o representante)
  parentescoRepresentante: text("parentesco_representante"), // NOM-004: Parentesco si es representante legal
  nombreTestigo1: text("nombre_testigo_1"), // NOM-004: Testigo 1
  nombreTestigo2: text("nombre_testigo_2"), // NOM-004: Testigo 2
  aceptado: boolean("aceptado").notNull().default(false),
  fechaAceptacion: timestamp("fecha_aceptacion"),
  lugarFirma: text("lugar_firma"), // NOM-004: Lugar de firma
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("patient_consents_patient_id_idx").on(table.patientId),
}));

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  fecha: date("fecha").notNull(),
  hora: time("hora").notNull(),
  duracion: text("duracion").notNull().default("30 min"),
  motivo: text("motivo"),
  status: text("status").notNull().default("pendiente"), // pendiente, en_curso, completada, no_asistio
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
}));

// Lab Orders (Órdenes de Laboratorio)
export const labOrders = pgTable("lab_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  estudios: text("estudios").array().notNull(), // List of tests to perform
  diagnosticoPresuntivo: text("diagnostico_presuntivo"),
  indicacionesClinicas: text("indicaciones_clinicas"),
  urgente: boolean("urgente").notNull().default(false),
  ayuno: boolean("ayuno").notNull().default(false),
  status: text("status").notNull().default("pendiente"), // pendiente, en_proceso, completada, cancelada
  resultados: text("resultados"),
  fechaResultados: timestamp("fecha_resultados"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("lab_orders_patient_id_idx").on(table.patientId),
}));

// Nursing Notes (NOM-004-SSA3-2012 - Hojas de Enfermería)
export const nursingNotes = pgTable("nursing_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  enfermeraId: varchar("enfermera_id").notNull().references(() => users.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  turno: text("turno").notNull(), // matutino, vespertino, nocturno
  // NOM-004: Campos obligatorios de hoja de enfermería
  habitusExterior: text("habitus_exterior"), // NOM-004: Habitus exterior
  signosVitalesId: varchar("signos_vitales_id").references(() => vitals.id), // Referencia a signos vitales
  // NOM-004: Ministración de medicamentos
  medicamentosMinistrados: text("medicamentos_ministrados"), // JSON: [{medicamento, dosis, via, hora}]
  // NOM-004: Procedimientos realizados
  procedimientosRealizados: text("procedimientos_realizados"),
  observaciones: text("observaciones"),
  firmada: boolean("firmada").notNull().default(false),
  fechaFirma: timestamp("fecha_firma"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  patientIdIdx: index("nursing_notes_patient_id_idx").on(table.patientId),
}));

// Establishment Configuration (NOM-004-SSA3-2012 - Datos del establecimiento)
export const establishmentConfig = pgTable("establishment_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // NOM-004: Datos del establecimiento obligatorios
  tipoEstablecimiento: text("tipo_establecimiento").notNull(), // consultorio, clinica, hospital
  nombreEstablecimiento: text("nombre_establecimiento").notNull(),
  domicilio: text("domicilio").notNull(),
  ciudad: text("ciudad").notNull(),
  estado: text("estado").notNull(),
  codigoPostal: text("codigo_postal"),
  telefono: text("telefono"),
  // NOM-004: Datos de la institución
  nombreInstitucion: text("nombre_institucion"), // Si pertenece a una institución
  razonSocial: text("razon_social"), // Razón o denominación social del propietario
  rfc: text("rfc"),
  licenciaSanitaria: text("licencia_sanitaria"),
  responsableSanitario: text("responsable_sanitario"),
  cedulaResponsable: text("cedula_responsable"),
  logoUrl: text("logo_url"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas and types
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertMedicalNoteSchema = createInsertSchema(medicalNotes).omit({ id: true, createdAt: true });
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
