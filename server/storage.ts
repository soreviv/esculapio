import { 
  type User, type InsertUser, 
  type Patient, type InsertPatient,
  type MedicalNote, type InsertMedicalNote,
  type Vitals, type InsertVitals,
  type Prescription, type InsertPrescription,
  type Appointment, type InsertAppointment,
  users, patients, medicalNotes, vitals, prescriptions, appointments
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

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
  searchPatients(query: string): Promise<Patient[]>;
  
  // Medical Notes
  getMedicalNotes(patientId: string): Promise<MedicalNote[]>;
  getMedicalNote(id: string): Promise<MedicalNote | undefined>;
  createMedicalNote(note: InsertMedicalNote): Promise<MedicalNote>;
  updateMedicalNote(id: string, note: Partial<InsertMedicalNote>): Promise<MedicalNote | undefined>;
  
  // Vitals
  getVitals(patientId: string): Promise<Vitals[]>;
  getLatestVitals(patientId: string): Promise<Vitals | undefined>;
  createVitals(vitalsData: InsertVitals): Promise<Vitals>;
  
  // Prescriptions
  getPrescriptions(patientId: string): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByDate(fecha: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
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

  async createMedicalNote(note: InsertMedicalNote): Promise<MedicalNote> {
    const [newNote] = await db.insert(medicalNotes).values(note).returning();
    return newNote;
  }

  async updateMedicalNote(id: string, note: Partial<InsertMedicalNote>): Promise<MedicalNote | undefined> {
    const [updated] = await db.update(medicalNotes).set(note).where(eq(medicalNotes.id, id)).returning();
    return updated;
  }

  // Vitals
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

  async createVitals(vitalsData: InsertVitals): Promise<Vitals> {
    const [newVitals] = await db.insert(vitals).values(vitalsData).returning();
    return newVitals;
  }

  // Prescriptions
  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    return db.select().from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
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
}

export const storage = new DatabaseStorage();
