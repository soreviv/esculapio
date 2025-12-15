import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, real, date, time } from "drizzle-orm/pg-core";
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

// Patients
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  alergias: text("alergias").array(),
  contactoEmergencia: text("contacto_emergencia"),
  telefonoEmergencia: text("telefono_emergencia"),
  status: text("status").notNull().default("activo"), // activo, alta, en_consulta
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical Notes
export const medicalNotes = pgTable("medical_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  tipo: text("tipo").notNull(), // historia_clinica, nota_evolucion, nota_egreso, interconsulta
  fecha: timestamp("fecha").notNull().defaultNow(),
  motivoConsulta: text("motivo_consulta"),
  subjetivo: text("subjetivo"),
  objetivo: text("objetivo"),
  analisis: text("analisis"),
  plan: text("plan"),
  diagnosticos: text("diagnosticos").array(),
  firmada: boolean("firmada").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

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
});

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
});

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
});

// Insert schemas and types
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertMedicalNoteSchema = createInsertSchema(medicalNotes).omit({ id: true, createdAt: true });
export const insertVitalsSchema = createInsertSchema(vitals).omit({ id: true, createdAt: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });

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
