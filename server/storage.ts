import { 
  type User, type InsertUser, 
  type Patient, type InsertPatient,
  type MedicalNote, type InsertMedicalNote,
  type MedicalNoteAddendum, type InsertMedicalNoteAddendum,
  type MedicalNoteDiagnosis, type InsertMedicalNoteDiagnosis,
  type Vitals, type InsertVitals,
  type Prescription, type InsertPrescription,
  type Appointment, type InsertAppointment,
  type AppointmentWithDetails, type MedicalNoteWithDetails, type PrescriptionWithDetails,
  type AuditLog, type InsertAuditLog,
  type Cie10, type InsertCie10,
  type PatientConsent, type InsertPatientConsent,
  type LabOrder, type InsertLabOrder, type LabOrderWithDetails,
  type DashboardMetrics, type PatientSearchFilters, type TimelineEvent,
  users, patients, medicalNotes, medicalNoteAddendums, medicalNoteDiagnoses, 
  vitals, prescriptions, appointments,
  auditLogs, cie10Catalog, patientConsents, labOrders
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";
import { encrypt, decrypt } from "./crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  
  // Medical Notes
  getMedicalNotes(patientId: string): Promise<MedicalNote[]>;
  getMedicalNote(id: string): Promise<MedicalNote | undefined>;
  createMedicalNote(note: InsertMedicalNote, diagnoses?: { codigo: string; tipo: string }[]): Promise<MedicalNote>;
  updateMedicalNote(id: string, note: Partial<InsertMedicalNote>): Promise<MedicalNote | undefined>;
  getNote(id: string): Promise<MedicalNote | undefined>;
  
  // Medical Note Addendums (Anexos)
  createAddendum(addendum: InsertMedicalNoteAddendum): Promise<MedicalNoteAddendum>;
  getAddendums(noteId: string): Promise<MedicalNoteAddendum[]>;
  
  // Medical Note Diagnoses
  getNoteDiagnoses(noteId: string): Promise<(MedicalNoteDiagnosis & { cie10: Cie10 })[]>;
  
  // Vitals
  getAllVitals(): Promise<Vitals[]>;
  getVitals(patientId: string): Promise<Vitals[]>;
  getVitalsById(id: string): Promise<Vitals | undefined>;
  getLatestVitals(patientId: string): Promise<Vitals | undefined>;
  createVitals(vitalsData: InsertVitals): Promise<Vitals>;
  
  // Prescriptions
  getAllPrescriptions(): Promise<Prescription[]>;
  getPrescriptions(patientId: string): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByDate(fecha: string): Promise<Appointment[]>;
  getAppointmentsWithDetails(): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDateWithDetails(fecha: string): Promise<AppointmentWithDetails[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  
  // Enriched Medical Notes
  getMedicalNotesWithDetails(patientId: string): Promise<MedicalNoteWithDetails[]>;
  
  // Enriched Prescriptions
  getPrescriptionsWithDetails(patientId: string): Promise<PrescriptionWithDetails[]>;
  
  // Audit Logs (NOM-024-SSA3-2012 compliance)
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entidad: string, entidadId: string): Promise<AuditLog[]>;
  
  // CIE-10 Catalog
  getCie10Codes(search?: string): Promise<Cie10[]>;
  getCie10Code(codigo: string): Promise<Cie10 | undefined>;
  createCie10Code(code: InsertCie10): Promise<Cie10>;
  
  // Patient Consents (LFPDPPP compliance)
  getPatientConsents(patientId: string): Promise<PatientConsent[]>;
  createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent>;
  
  // Sign Medical Note
  signMedicalNote(id: string, userId: string, hash: string): Promise<MedicalNote | undefined>;
  
  // Lab Orders
  getAllLabOrders(): Promise<LabOrder[]>;
  getLabOrders(patientId: string): Promise<LabOrder[]>;
  getLabOrder(id: string): Promise<LabOrder | undefined>;
  createLabOrder(order: InsertLabOrder): Promise<LabOrder>;
  updateLabOrder(id: string, order: Partial<InsertLabOrder>): Promise<LabOrder | undefined>;
  getLabOrdersWithDetails(): Promise<LabOrderWithDetails[]>;
  
  // Dashboard Metrics
  getDashboardMetrics(): Promise<DashboardMetrics>;
  
  // Advanced Patient Search
  searchPatientsAdvanced(filters: PatientSearchFilters): Promise<Patient[]>;
  
  // Patient Timeline
  getPatientTimeline(patientId: string): Promise<TimelineEvent[]>;

  // FHIR Compatibility Aliases
  getPatientNotes(patientId: string): Promise<MedicalNote[]>;
  getPatientVitals(patientId: string): Promise<Vitals[]>;
  getPatientPrescriptions(patientId: string): Promise<Prescription[]>;
  getPatientLabOrders(patientId: string): Promise<LabOrder[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Patients
  private encryptPatient(patient: Partial<InsertPatient>) {
    const p = { ...patient };
    if (p.curp) p.curp = encrypt(p.curp);
    if (p.telefono) p.telefono = encrypt(p.telefono);
    if (p.email) p.email = encrypt(p.email);
    if (p.direccion) p.direccion = encrypt(p.direccion);
    if (p.contactoEmergencia) p.contactoEmergencia = encrypt(p.contactoEmergencia);
    if (p.telefonoEmergencia) p.telefonoEmergencia = encrypt(p.telefonoEmergencia);
    return p;
  }

  private decryptPatient(patient: Patient): Patient {
    return {
      ...patient,
      curp: decrypt(patient.curp),
      telefono: patient.telefono ? decrypt(patient.telefono) : null,
      email: patient.email ? decrypt(patient.email) : null,
      direccion: patient.direccion ? decrypt(patient.direccion) : null,
      contactoEmergencia: patient.contactoEmergencia ? decrypt(patient.contactoEmergencia) : null,
      telefonoEmergencia: patient.telefonoEmergencia ? decrypt(patient.telefonoEmergencia) : null,
    };
  }

  async getPatients(): Promise<Patient[]> {
    const results = await db.select().from(patients).orderBy(desc(patients.createdAt));
    return results.map(p => this.decryptPatient(p));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient ? this.decryptPatient(patient) : undefined;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const encrypted = this.encryptPatient(patient) as InsertPatient;
    const [newPatient] = await db.insert(patients).values(encrypted).returning();
    return this.decryptPatient(newPatient);
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const encrypted = this.encryptPatient(patient);
    const [updated] = await db.update(patients).set(encrypted).where(eq(patients.id, id)).returning();
    return updated ? this.decryptPatient(updated) : undefined;
  }

  async deletePatient(id: string): Promise<Patient | undefined> {
    const [deleted] = await db.delete(patients).where(eq(patients.id, id)).returning();
    return deleted ? this.decryptPatient(deleted) : undefined;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const results = await db.select().from(patients).where(
      or(
        ilike(patients.nombre, `%${query}%`),
        ilike(patients.apellidoPaterno, `%${query}%`),
        ilike(patients.numeroExpediente, `%${query}%`)
      )
    );
    return results.map(p => this.decryptPatient(p));
  }

  // Medical Notes
  async getMedicalNotes(patientId: string): Promise<MedicalNote[]> {
    return db.select().from(medicalNotes)
      .where(eq(medicalNotes.patientId, patientId))
      .orderBy(desc(medicalNotes.fecha));
  }

  async getMedicalNote(id: string): Promise<MedicalNote | undefined> {
    const [note] = await db.select().from(medicalNotes).where(eq(medicalNotes.id, id));
    return note;
  }

  async getNote(id: string): Promise<MedicalNote | undefined> {
    return this.getMedicalNote(id);
  }

  async createMedicalNote(note: InsertMedicalNote, diagnoses?: { codigo: string; tipo: string }[]): Promise<MedicalNote> {
    return await db.transaction(async (tx) => {
      const [newNote] = await tx.insert(medicalNotes).values(note).returning();
      
      if (diagnoses && diagnoses.length > 0) {
        await tx.insert(medicalNoteDiagnoses).values(
          diagnoses.map(d => ({
            noteId: newNote.id,
            cie10Codigo: d.codigo,
            tipoDiagnostico: d.tipo
          }))
        );
      }
      
      return newNote;
    });
  }

  async updateMedicalNote(id: string, note: Partial<InsertMedicalNote>): Promise<MedicalNote | undefined> {
    // Note: Signed notes should not be editable, but this method exists for draft updates
    const [updated] = await db.update(medicalNotes).set(note).where(eq(medicalNotes.id, id)).returning();
    return updated;
  }

  // Medical Note Addendums (Anexos)
  async createAddendum(addendum: InsertMedicalNoteAddendum): Promise<MedicalNoteAddendum> {
    const [newAddendum] = await db.insert(medicalNoteAddendums).values(addendum).returning();
    return newAddendum;
  }

  async getAddendums(noteId: string): Promise<MedicalNoteAddendum[]> {
    return db.select().from(medicalNoteAddendums)
      .where(eq(medicalNoteAddendums.originalNoteId, noteId))
      .orderBy(desc(medicalNoteAddendums.fecha));
  }

  // Medical Note Diagnoses
  async getNoteDiagnoses(noteId: string): Promise<(MedicalNoteDiagnosis & { cie10: Cie10 })[]> {
    const results = await db
      .select({
        diagnosis: medicalNoteDiagnoses,
        cie10: cie10Catalog
      })
      .from(medicalNoteDiagnoses)
      .innerJoin(cie10Catalog, eq(medicalNoteDiagnoses.cie10Codigo, cie10Catalog.codigo))
      .where(eq(medicalNoteDiagnoses.noteId, noteId));
    
    return results.map(r => ({
      ...r.diagnosis,
      cie10: r.cie10
    }));
  }

  // Vitals
  async getAllVitals(): Promise<Vitals[]> {
    return db.select().from(vitals).orderBy(desc(vitals.fecha));
  }

  async getVitals(patientId: string): Promise<Vitals[]> {
    return db.select().from(vitals)
      .where(eq(vitals.patientId, patientId))
      .orderBy(desc(vitals.fecha));
  }

  async getLatestVitals(patientId: string): Promise<Vitals | undefined> {
    const [latest] = await db.select().from(vitals)
      .where(eq(vitals.patientId, patientId))
      .orderBy(desc(vitals.fecha))
      .limit(1);
    return latest;
  }

  async getVitalsById(id: string): Promise<Vitals | undefined> {
    const [result] = await db.select().from(vitals).where(eq(vitals.id, id));
    return result;
  }

  async createVitals(vitalsData: InsertVitals): Promise<Vitals> {
    const [newVitals] = await db.insert(vitals).values(vitalsData).returning();
    return newVitals;
  }

  // Prescriptions
  async getAllPrescriptions(): Promise<Prescription[]> {
    return db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    return db.select().from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [result] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return result;
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await db.insert(prescriptions).values(prescription).returning();
    return newPrescription;
  }

  async updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [updated] = await db.update(prescriptions).set(prescription).where(eq(prescriptions.id, id)).returning();
    return updated;
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments).orderBy(desc(appointments.fecha));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
    const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
    return result;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return db.select().from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.fecha));
  }

  async getAppointmentsByDate(fecha: string): Promise<Appointment[]> {
    return db.select().from(appointments)
      .where(eq(appointments.fecha, fecha))
      .orderBy(appointments.hora);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updated] = await db.update(appointments).set(appointment).where(eq(appointments.id, id)).returning();
    return updated;
  }

  // Enriched appointments with patient and medico details
  async getAppointmentsWithDetails(): Promise<AppointmentWithDetails[]> {
    const result = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        medicoId: appointments.medicoId,
        fecha: appointments.fecha,
        hora: appointments.hora,
        duracion: appointments.duracion,
        motivo: appointments.motivo,
        status: appointments.status,
        createdAt: appointments.createdAt,
        patientNombre: patients.nombre,
        patientApellido: patients.apellidoPaterno,
        medicoNombre: users.nombre,
        medicoEspecialidad: users.especialidad,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.medicoId, users.id))
      .orderBy(desc(appointments.fecha));
    
    return result.map(r => ({
      ...r,
      patientNombre: r.patientNombre || "Paciente",
      patientApellido: r.patientApellido || "",
      medicoNombre: r.medicoNombre || "Médico",
    }));
  }

  async getAppointmentsByDateWithDetails(fecha: string): Promise<AppointmentWithDetails[]> {
    const result = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        medicoId: appointments.medicoId,
        fecha: appointments.fecha,
        hora: appointments.hora,
        duracion: appointments.duracion,
        motivo: appointments.motivo,
        status: appointments.status,
        createdAt: appointments.createdAt,
        patientNombre: patients.nombre,
        patientApellido: patients.apellidoPaterno,
        medicoNombre: users.nombre,
        medicoEspecialidad: users.especialidad,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.medicoId, users.id))
      .where(eq(appointments.fecha, fecha))
      .orderBy(appointments.hora);
    
    return result.map(r => ({
      ...r,
      patientNombre: r.patientNombre || "Paciente",
      patientApellido: r.patientApellido || "",
      medicoNombre: r.medicoNombre || "Médico",
    }));
  }

  // Enriched medical notes with medico details
  async getMedicalNotesWithDetails(patientId: string): Promise<MedicalNoteWithDetails[]> {
    const notesResults = await db
      .select()
      .from(medicalNotes)
      .leftJoin(users, eq(medicalNotes.medicoId, users.id))
      .where(eq(medicalNotes.patientId, patientId))
      .orderBy(desc(medicalNotes.fecha));
    
    return Promise.all(notesResults.map(async (r) => {
      const noteId = r.medical_notes.id;
      
      const [diagnoses, addendums] = await Promise.all([
        this.getNoteDiagnoses(noteId),
        this.getAddendums(noteId)
      ]);

      return {
        ...r.medical_notes,
        medicoNombre: r.users?.nombre || "Médico",
        medicoEspecialidad: r.users?.especialidad || null,
        diagnosticos: diagnoses.map(d => ({
          codigo: d.cie10Codigo,
          descripcion: d.cie10.descripcion,
          tipo: d.tipoDiagnostico || "presuntivo"
        })),
        anexos: addendums
      };
    }));
  }

  async getAllMedicalNotesWithDetails(): Promise<MedicalNoteWithDetails[]> {
    const result = await db
      .select({
        medical_note: medicalNotes,
        medicoNombre: users.nombre,
        medicoEspecialidad: users.especialidad,
        patientNombre: patients.nombre,
        patientApellido: patients.apellidoPaterno,
      })
      .from(medicalNotes)
      .leftJoin(users, eq(medicalNotes.medicoId, users.id))
      .leftJoin(patients, eq(medicalNotes.patientId, patients.id))
      .orderBy(desc(medicalNotes.fecha));

    return Promise.all(result.map(async (r) => {
      const noteId = r.medical_note.id;
      const [diagnoses, addendums] = await Promise.all([
        this.getNoteDiagnoses(noteId),
        this.getAddendums(noteId)
      ]);

      return {
        ...r.medical_note,
        medicoNombre: r.medicoNombre || "Médico",
        medicoEspecialidad: r.medicoEspecialidad || null,
        patientNombre: r.patientNombre || "Paciente",
        patientApellido: r.patientApellido || "",
        diagnosticos: diagnoses.map(d => ({
          codigo: d.cie10Codigo,
          descripcion: d.cie10.descripcion,
          tipo: d.tipoDiagnostico || "presuntivo"
        })),
        anexos: addendums
      };
    }));
  }

  // Enriched prescriptions with medico details
  async getPrescriptionsWithDetails(patientId: string): Promise<PrescriptionWithDetails[]> {
    const result = await db
      .select({
        id: prescriptions.id,
        patientId: prescriptions.patientId,
        medicoId: prescriptions.medicoId,
        medicamento: prescriptions.medicamento,
        presentacion: prescriptions.presentacion,
        dosis: prescriptions.dosis,
        via: prescriptions.via,
        frecuencia: prescriptions.frecuencia,
        duracion: prescriptions.duracion,
        indicaciones: prescriptions.indicaciones,
        status: prescriptions.status,
        createdAt: prescriptions.createdAt,
        medicoNombre: users.nombre,
      })
      .from(prescriptions)
      .leftJoin(users, eq(prescriptions.medicoId, users.id))
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
    
    return result.map(r => ({
      ...r,
      medicoNombre: r.medicoNombre || "Médico",
    }));
  }

  // Audit Logs (NOM-024-SSA3-2012 compliance)
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.fecha)).limit(limit);
  }

  async getAuditLogsByEntity(entidad: string, entidadId: string): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(and(eq(auditLogs.entidad, entidad), eq(auditLogs.entidadId, entidadId)))
      .orderBy(desc(auditLogs.fecha));
  }

  // CIE-10 Catalog
  async getCie10Codes(search?: string): Promise<Cie10[]> {
    if (search) {
      return db.select().from(cie10Catalog)
        .where(or(
          ilike(cie10Catalog.codigo, `%${search}%`),
          ilike(cie10Catalog.descripcion, `%${search}%`)
        ))
        .limit(50);
    }
    return db.select().from(cie10Catalog).limit(100);
  }

  async getCie10Code(codigo: string): Promise<Cie10 | undefined> {
    const [code] = await db.select().from(cie10Catalog).where(eq(cie10Catalog.codigo, codigo));
    return code;
  }

  async createCie10Code(code: InsertCie10): Promise<Cie10> {
    const [newCode] = await db.insert(cie10Catalog).values(code).returning();
    return newCode;
  }

  // Patient Consents (LFPDPPP compliance)
  async getPatientConsents(patientId: string): Promise<PatientConsent[]> {
    return db.select().from(patientConsents)
      .where(eq(patientConsents.patientId, patientId))
      .orderBy(desc(patientConsents.createdAt));
  }

  async createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent> {
    const [newConsent] = await db.insert(patientConsents).values(consent).returning();
    return newConsent;
  }

  // Sign Medical Note (NOM-024-SSA3-2012 compliance - firma electrónica)
  async signMedicalNote(id: string, userId: string, hash: string): Promise<MedicalNote | undefined> {
    const [updated] = await db.update(medicalNotes).set({
      firmada: true,
      firmaHash: hash,
      fechaFirma: new Date(),
      firmaUserId: userId,
    }).where(eq(medicalNotes.id, id)).returning();
    return updated;
  }

  // Lab Orders
  async getAllLabOrders(): Promise<LabOrder[]> {
    return db.select().from(labOrders).orderBy(desc(labOrders.createdAt));
  }

  async getLabOrders(patientId: string): Promise<LabOrder[]> {
    return db.select().from(labOrders)
      .where(eq(labOrders.patientId, patientId))
      .orderBy(desc(labOrders.createdAt));
  }

  async getLabOrder(id: string): Promise<LabOrder | undefined> {
    const [order] = await db.select().from(labOrders).where(eq(labOrders.id, id));
    return order;
  }

  async createLabOrder(order: InsertLabOrder): Promise<LabOrder> {
    const [newOrder] = await db.insert(labOrders).values(order).returning();
    return newOrder;
  }

  async updateLabOrder(id: string, order: Partial<InsertLabOrder>): Promise<LabOrder | undefined> {
    const [updated] = await db.update(labOrders).set(order).where(eq(labOrders.id, id)).returning();
    return updated;
  }

  async getLabOrdersWithDetails(): Promise<LabOrderWithDetails[]> {
    const result = await db
      .select({
        id: labOrders.id,
        patientId: labOrders.patientId,
        medicoId: labOrders.medicoId,
        estudios: labOrders.estudios,
        diagnosticoPresuntivo: labOrders.diagnosticoPresuntivo,
        indicacionesClinicas: labOrders.indicacionesClinicas,
        urgente: labOrders.urgente,
        ayuno: labOrders.ayuno,
        status: labOrders.status,
        resultados: labOrders.resultados,
        fechaResultados: labOrders.fechaResultados,
        createdAt: labOrders.createdAt,
        patientNombre: patients.nombre,
        patientApellido: patients.apellidoPaterno,
        medicoNombre: users.nombre,
      })
      .from(labOrders)
      .leftJoin(patients, eq(labOrders.patientId, patients.id))
      .leftJoin(users, eq(labOrders.medicoId, users.id))
      .orderBy(desc(labOrders.createdAt));
    
    return result.map(r => ({
      ...r,
      patientNombre: r.patientNombre || "Paciente",
      patientApellido: r.patientApellido || "",
      medicoNombre: r.medicoNombre || "Médico",
    }));
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Fetch all metrics concurrently for better performance
    const [
      totalPacientesResult,
      pacientesActivosResult,
      citasHoyResult,
      citasPendientesResult,
      citasCompletadasResult,
      notasMedicasHoyResult,
      prescripcionesActivasResult,
      citasPorDiaResult,
      citasPorEstadoResult,
      pacientesPorMesResult
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(patients),
      db.select({ count: sql<number>`count(*)` }).from(patients).where(eq(patients.status, 'activo')),
      db.select({ count: sql<number>`count(*)` }).from(appointments).where(sql`DATE(${appointments.fecha}) = DATE(${today.toISOString()})`),
      db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.status, 'pendiente')),
      db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.status, 'completada')),
      db.select({ count: sql<number>`count(*)` }).from(medicalNotes).where(sql`DATE(${medicalNotes.fecha}) = DATE(${today.toISOString()})`),
      db.select({ count: sql<number>`count(*)` }).from(prescriptions).where(eq(prescriptions.status, 'activa')),
      db.select({
        fecha: sql<string>`DATE(${appointments.fecha})::text`,
        total: sql<number>`count(*)`
      }).from(appointments)
        .where(sql`${appointments.fecha} >= ${sevenDaysAgo.toISOString()}`)
        .groupBy(sql`DATE(${appointments.fecha})`)
        .orderBy(sql`DATE(${appointments.fecha})`),
      db.select({
        estado: appointments.status,
        total: sql<number>`count(*)`
      }).from(appointments)
        .groupBy(appointments.status),
      db.select({
        mes: sql<string>`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`,
        total: sql<number>`count(*)`
      }).from(patients)
        .where(sql`${patients.createdAt} >= ${sixMonthsAgo.toISOString()}`)
        .groupBy(sql`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`)
    ]);

    return {
      totalPacientes: Number(totalPacientesResult[0]?.count || 0),
      pacientesActivos: Number(pacientesActivosResult[0]?.count || 0),
      citasHoy: Number(citasHoyResult[0]?.count || 0),
      citasPendientes: Number(citasPendientesResult[0]?.count || 0),
      citasCompletadas: Number(citasCompletadasResult[0]?.count || 0),
      notasMedicasHoy: Number(notasMedicasHoyResult[0]?.count || 0),
      prescripcionesActivas: Number(prescripcionesActivasResult[0]?.count || 0),
      citasPorDia: citasPorDiaResult.map(r => ({ fecha: r.fecha, total: Number(r.total) })),
      citasPorEstado: citasPorEstadoResult.map(r => ({ estado: r.estado || 'desconocido', total: Number(r.total) })),
      pacientesPorMes: pacientesPorMesResult.map(r => ({ mes: r.mes, total: Number(r.total) }))
    };
  }

  // Advanced Patient Search
  async searchPatientsAdvanced(filters: PatientSearchFilters): Promise<Patient[]> {
    const conditions = [];

    if (filters.query) {
      conditions.push(
        or(
          ilike(patients.nombre, `%${filters.query}%`),
          ilike(patients.apellidoPaterno, `%${filters.query}%`),
          ilike(patients.numeroExpediente, `%${filters.query}%`)
        )
      );
    }

    if (filters.status) {
      conditions.push(eq(patients.status, filters.status));
    }

    if (filters.fechaDesde) {
      conditions.push(sql`${patients.createdAt} >= ${filters.fechaDesde}`);
    }

    if (filters.fechaHasta) {
      conditions.push(sql`${patients.createdAt} <= ${filters.fechaHasta}`);
    }

    // If searching by diagnosis
    if (filters.diagnostico) {
      const diagnosisSubquery = db.select({ noteId: medicalNoteDiagnoses.noteId })
        .from(medicalNoteDiagnoses)
        .where(eq(medicalNoteDiagnoses.cie10Codigo, filters.diagnostico));
      
      const patientSubquery = db.select({ patientId: medicalNotes.patientId })
        .from(medicalNotes)
        .where(sql`${medicalNotes.id} IN (${diagnosisSubquery})`);
        
      conditions.push(sql`${patients.id} IN (${patientSubquery})`);
    }

    if (filters.medicoId) {
      const medicoSubquery = db.select({ patientId: medicalNotes.patientId })
        .from(medicalNotes)
        .where(eq(medicalNotes.medicoId, filters.medicoId));
        
      conditions.push(sql`${patients.id} IN (${medicoSubquery})`);
    }

    let results;
    if (conditions.length === 0) {
      results = await db.select().from(patients).orderBy(desc(patients.createdAt)).limit(100);
    } else {
      results = await db.select().from(patients)
        .where(and(...conditions))
        .orderBy(desc(patients.createdAt))
        .limit(100);
    }

    return results.map(p => this.decryptPatient(p));
  }

  // Patient Timeline
  async getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // Get all data sources concurrently for better performance
    const [
      notes,
      vitalsRecords,
      prescriptionRecords,
      appointmentRecords,
      labOrderRecords
    ] = await Promise.all([
      db.select({
        id: medicalNotes.id,
        fecha: medicalNotes.fecha,
        tipo: medicalNotes.tipo,
        motivoConsulta: medicalNotes.motivoConsulta,
        medicoNombre: users.nombre
      }).from(medicalNotes)
        .leftJoin(users, eq(medicalNotes.medicoId, users.id))
        .where(eq(medicalNotes.patientId, patientId))
        .orderBy(desc(medicalNotes.fecha)),

      db.select({
        id: vitals.id,
        fecha: vitals.fecha,
        presionSistolica: vitals.presionSistolica,
        presionDiastolica: vitals.presionDiastolica,
        frecuenciaCardiaca: vitals.frecuenciaCardiaca,
        temperatura: vitals.temperatura,
        medicoNombre: users.nombre
      }).from(vitals)
        .leftJoin(users, eq(vitals.registradoPorId, users.id))
        .where(eq(vitals.patientId, patientId))
        .orderBy(desc(vitals.fecha)),

      db.select({
        id: prescriptions.id,
        createdAt: prescriptions.createdAt,
        medicamento: prescriptions.medicamento,
        dosis: prescriptions.dosis,
        status: prescriptions.status,
        medicoNombre: users.nombre
      }).from(prescriptions)
        .leftJoin(users, eq(prescriptions.medicoId, users.id))
        .where(eq(prescriptions.patientId, patientId))
        .orderBy(desc(prescriptions.createdAt)),

      db.select({
        id: appointments.id,
        fecha: appointments.fecha,
        motivo: appointments.motivo,
        status: appointments.status,
        medicoNombre: users.nombre
      }).from(appointments)
        .leftJoin(users, eq(appointments.medicoId, users.id))
        .where(eq(appointments.patientId, patientId))
        .orderBy(desc(appointments.fecha)),

      db.select({
        id: labOrders.id,
        createdAt: labOrders.createdAt,
        estudios: labOrders.estudios,
        status: labOrders.status,
        medicoNombre: users.nombre
      }).from(labOrders)
        .leftJoin(users, eq(labOrders.medicoId, users.id))
        .where(eq(labOrders.patientId, patientId))
        .orderBy(desc(labOrders.createdAt))
    ]);

    for (const note of notes) {
      events.push({
        id: note.id,
        tipo: 'nota_medica',
        fecha: note.fecha,
        titulo: `Nota: ${note.tipo.replace('_', ' ')}`,
        descripcion: note.motivoConsulta || undefined,
        medicoNombre: note.medicoNombre || undefined,
        detalles: { tipo: note.tipo }
      });
    }

    for (const v of vitalsRecords) {
      events.push({
        id: v.id,
        tipo: 'vitales',
        fecha: v.fecha,
        titulo: 'Signos Vitales',
        descripcion: `PA: ${v.presionSistolica || '-'}/${v.presionDiastolica || '-'}, FC: ${v.frecuenciaCardiaca || '-'}, T: ${v.temperatura || '-'}°C`,
        medicoNombre: v.medicoNombre || undefined,
        detalles: { presionSistolica: v.presionSistolica, presionDiastolica: v.presionDiastolica }
      });
    }

    for (const p of prescriptionRecords) {
      events.push({
        id: p.id,
        tipo: 'receta',
        fecha: p.createdAt!,
        titulo: `Receta: ${p.medicamento}`,
        descripcion: `${p.dosis || ''} - ${p.status}`,
        medicoNombre: p.medicoNombre || undefined,
        detalles: { medicamento: p.medicamento, dosis: p.dosis }
      });
    }

    for (const a of appointmentRecords) {
      events.push({
        id: a.id,
        tipo: 'cita',
        fecha: new Date(a.fecha),
        titulo: `Cita: ${a.motivo || 'Consulta'}`,
        descripcion: a.status,
        medicoNombre: a.medicoNombre || undefined,
        detalles: { status: a.status }
      });
    }

    for (const l of labOrderRecords) {
      events.push({
        id: l.id,
        tipo: 'orden_laboratorio',
        fecha: l.createdAt!,
        titulo: 'Orden de Laboratorio',
        descripcion: l.estudios?.join(', ') || '',
        medicoNombre: l.medicoNombre || undefined,
        detalles: { estudios: l.estudios, status: l.status }
      });
    }

    // Sort all events by date descending
    events.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return events;
  }

  // FHIR Compatibility Alias Methods
  async getPatientNotes(patientId: string): Promise<MedicalNote[]> {
    return this.getMedicalNotes(patientId);
  }

  async getPatientVitals(patientId: string): Promise<Vitals[]> {
    return db.select().from(vitals)
      .where(eq(vitals.patientId, patientId))
      .orderBy(desc(vitals.fecha));
  }

  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    return this.getPrescriptions(patientId);
  }

  async getPatientLabOrders(patientId: string): Promise<LabOrder[]> {
    return this.getLabOrders(patientId);
  }
}

export const storage = new DatabaseStorage();
