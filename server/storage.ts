import { 
  type User, type InsertUser, 
  type Patient, type InsertPatient,
  type MedicalNote, type InsertMedicalNote,
  type Vitals, type InsertVitals,
  type Prescription, type InsertPrescription,
  type Appointment, type InsertAppointment,
  type AppointmentWithDetails, type MedicalNoteWithDetails, type PrescriptionWithDetails,
  type AuditLog, type InsertAuditLog,
  type Cie10, type InsertCie10,
  type PatientConsent, type InsertPatientConsent,
  type LabOrder, type InsertLabOrder, type LabOrderWithDetails,
  type DashboardMetrics, type PatientSearchFilters, type TimelineEvent,
  users, patients, medicalNotes, vitals, prescriptions, appointments,
  auditLogs, cie10Catalog, patientConsents, labOrders
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

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
  createMedicalNote(note: InsertMedicalNote): Promise<MedicalNote>;
  updateMedicalNote(id: string, note: Partial<InsertMedicalNote>): Promise<MedicalNote | undefined>;
  getNote(id: string): Promise<MedicalNote | undefined>;
  
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
  async getPatients(): Promise<Patient[]> {
    return db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [updated] = await db.update(patients).set(patient).where(eq(patients.id, id)).returning();
    return updated;
  }

  async deletePatient(id: string): Promise<Patient | undefined> {
    const [deleted] = await db.delete(patients).where(eq(patients.id, id)).returning();
    return deleted;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return db.select().from(patients).where(
      or(
        ilike(patients.nombre, `%${query}%`),
        ilike(patients.apellidoPaterno, `%${query}%`),
        ilike(patients.curp, `%${query}%`)
      )
    );
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

  async createMedicalNote(note: InsertMedicalNote): Promise<MedicalNote> {
    const [newNote] = await db.insert(medicalNotes).values(note).returning();
    return newNote;
  }

  async updateMedicalNote(id: string, note: Partial<InsertMedicalNote>): Promise<MedicalNote | undefined> {
    const [updated] = await db.update(medicalNotes).set(note).where(eq(medicalNotes.id, id)).returning();
    return updated;
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
    const result = await db
      .select()
      .from(medicalNotes)
      .leftJoin(users, eq(medicalNotes.medicoId, users.id))
      .where(eq(medicalNotes.patientId, patientId))
      .orderBy(desc(medicalNotes.fecha));
    
    return result.map(r => ({
      ...r.medical_notes,
      medicoNombre: r.users?.nombre || "Médico",
      medicoEspecialidad: r.users?.especialidad || null,
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total patients
    const [totalPacientesResult] = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const totalPacientes = Number(totalPacientesResult?.count || 0);

    // Active patients
    const [pacientesActivosResult] = await db.select({ count: sql<number>`count(*)` }).from(patients).where(eq(patients.status, 'activo'));
    const pacientesActivos = Number(pacientesActivosResult?.count || 0);

    // Today's appointments
    const [citasHoyResult] = await db.select({ count: sql<number>`count(*)` }).from(appointments)
      .where(sql`DATE(${appointments.fecha}) = DATE(${today.toISOString()})`);
    const citasHoy = Number(citasHoyResult?.count || 0);

    // Pending appointments
    const [citasPendientesResult] = await db.select({ count: sql<number>`count(*)` }).from(appointments)
      .where(eq(appointments.status, 'pendiente'));
    const citasPendientes = Number(citasPendientesResult?.count || 0);

    // Completed appointments
    const [citasCompletadasResult] = await db.select({ count: sql<number>`count(*)` }).from(appointments)
      .where(eq(appointments.status, 'completada'));
    const citasCompletadas = Number(citasCompletadasResult?.count || 0);

    // Today's medical notes
    const [notasMedicasHoyResult] = await db.select({ count: sql<number>`count(*)` }).from(medicalNotes)
      .where(sql`DATE(${medicalNotes.fecha}) = DATE(${today.toISOString()})`);
    const notasMedicasHoy = Number(notasMedicasHoyResult?.count || 0);

    // Active prescriptions
    const [prescripcionesActivasResult] = await db.select({ count: sql<number>`count(*)` }).from(prescriptions)
      .where(eq(prescriptions.status, 'activa'));
    const prescripcionesActivas = Number(prescripcionesActivasResult?.count || 0);

    // Appointments by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const citasPorDiaResult = await db.select({
      fecha: sql<string>`DATE(${appointments.fecha})::text`,
      total: sql<number>`count(*)`
    }).from(appointments)
      .where(sql`${appointments.fecha} >= ${sevenDaysAgo.toISOString()}`)
      .groupBy(sql`DATE(${appointments.fecha})`)
      .orderBy(sql`DATE(${appointments.fecha})`);
    
    const citasPorDia = citasPorDiaResult.map(r => ({ fecha: r.fecha, total: Number(r.total) }));

    // Appointments by status
    const citasPorEstadoResult = await db.select({
      estado: appointments.status,
      total: sql<number>`count(*)`
    }).from(appointments)
      .groupBy(appointments.status);
    
    const citasPorEstado = citasPorEstadoResult.map(r => ({ estado: r.estado, total: Number(r.total) }));

    // Patients by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const pacientesPorMesResult = await db.select({
      mes: sql<string>`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`,
      total: sql<number>`count(*)`
    }).from(patients)
      .where(sql`${patients.createdAt} >= ${sixMonthsAgo.toISOString()}`)
      .groupBy(sql`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`);
    
    const pacientesPorMes = pacientesPorMesResult.map(r => ({ mes: r.mes, total: Number(r.total) }));

    return {
      totalPacientes,
      pacientesActivos,
      citasHoy,
      citasPendientes,
      citasCompletadas,
      notasMedicasHoy,
      prescripcionesActivas,
      citasPorDia,
      citasPorEstado,
      pacientesPorMes
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
          ilike(patients.curp, `%${filters.query}%`),
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

    // If searching by diagnosis or doctor, we need to join with medical notes
    if (filters.diagnostico || filters.medicoId) {
      const subquery = db.select({ patientId: medicalNotes.patientId })
        .from(medicalNotes)
        .where(
          and(
            filters.diagnostico ? sql`${filters.diagnostico} = ANY(${medicalNotes.diagnosticosCie10})` : undefined,
            filters.medicoId ? eq(medicalNotes.medicoId, filters.medicoId) : undefined
          )
        );
      
      conditions.push(sql`${patients.id} IN (${subquery})`);
    }

    if (conditions.length === 0) {
      return db.select().from(patients).orderBy(desc(patients.createdAt)).limit(100);
    }

    return db.select().from(patients)
      .where(and(...conditions))
      .orderBy(desc(patients.createdAt))
      .limit(100);
  }

  // Patient Timeline
  async getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // Get medical notes
    const notes = await db.select({
      id: medicalNotes.id,
      fecha: medicalNotes.fecha,
      tipo: medicalNotes.tipo,
      motivoConsulta: medicalNotes.motivoConsulta,
      diagnosticos: medicalNotes.diagnosticos,
      medicoNombre: users.nombre
    }).from(medicalNotes)
      .leftJoin(users, eq(medicalNotes.medicoId, users.id))
      .where(eq(medicalNotes.patientId, patientId))
      .orderBy(desc(medicalNotes.fecha));

    for (const note of notes) {
      events.push({
        id: note.id,
        tipo: 'nota_medica',
        fecha: note.fecha,
        titulo: `Nota: ${note.tipo.replace('_', ' ')}`,
        descripcion: note.motivoConsulta || undefined,
        medicoNombre: note.medicoNombre || undefined,
        detalles: { diagnosticos: note.diagnosticos }
      });
    }

    // Get vitals
    const vitalsRecords = await db.select({
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
      .orderBy(desc(vitals.fecha));

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

    // Get prescriptions
    const prescriptionRecords = await db.select({
      id: prescriptions.id,
      createdAt: prescriptions.createdAt,
      medicamento: prescriptions.medicamento,
      dosis: prescriptions.dosis,
      status: prescriptions.status,
      medicoNombre: users.nombre
    }).from(prescriptions)
      .leftJoin(users, eq(prescriptions.medicoId, users.id))
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));

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

    // Get appointments
    const appointmentRecords = await db.select({
      id: appointments.id,
      fecha: appointments.fecha,
      motivo: appointments.motivo,
      status: appointments.status,
      medicoNombre: users.nombre
    }).from(appointments)
      .leftJoin(users, eq(appointments.medicoId, users.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.fecha));

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

    // Get lab orders
    const labOrderRecords = await db.select({
      id: labOrders.id,
      createdAt: labOrders.createdAt,
      estudios: labOrders.estudios,
      status: labOrders.status,
      medicoNombre: users.nombre
    }).from(labOrders)
      .leftJoin(users, eq(labOrders.medicoId, users.id))
      .where(eq(labOrders.patientId, patientId))
      .orderBy(desc(labOrders.createdAt));

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
