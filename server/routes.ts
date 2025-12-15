import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertMedicalNoteSchema, 
  insertVitalsSchema, 
  insertPrescriptionSchema, 
  insertAppointmentSchema 
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error fetching patients" });
    }
  });

  app.get("/api/patients/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error searching patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error fetching patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const parsed = insertPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const patient = await storage.createPatient(parsed.data);
      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error creating patient" });
    }
  });

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error updating patient" });
    }
  });

  // Medical Notes
  app.get("/api/patients/:patientId/notes", async (req, res) => {
    try {
      const notes = await storage.getMedicalNotes(req.params.patientId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getMedicalNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Error fetching note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const parsed = insertMedicalNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const note = await storage.createMedicalNote(parsed.data);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Error creating note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateMedicalNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Error updating note" });
    }
  });

  // Vitals
  app.get("/api/patients/:patientId/vitals", async (req, res) => {
    try {
      const vitalsList = await storage.getVitals(req.params.patientId);
      res.json(vitalsList);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vitals" });
    }
  });

  app.get("/api/patients/:patientId/vitals/latest", async (req, res) => {
    try {
      const latest = await storage.getLatestVitals(req.params.patientId);
      res.json(latest || null);
    } catch (error) {
      res.status(500).json({ error: "Error fetching latest vitals" });
    }
  });

  app.post("/api/vitals", async (req, res) => {
    try {
      const parsed = insertVitalsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const vitals = await storage.createVitals(parsed.data);
      res.status(201).json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Error creating vitals" });
    }
  });

  // Prescriptions
  app.get("/api/patients/:patientId/prescriptions", async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptions(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching prescriptions" });
    }
  });

  app.post("/api/prescriptions", async (req, res) => {
    try {
      const parsed = insertPrescriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const prescription = await storage.createPrescription(parsed.data);
      res.status(201).json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Error creating prescription" });
    }
  });

  app.patch("/api/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await storage.updatePrescription(req.params.id, req.body);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Error updating prescription" });
    }
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const fecha = req.query.fecha as string;
      if (fecha) {
        const appointments = await storage.getAppointmentsByDate(fecha);
        res.json(appointments);
      } else {
        const appointments = await storage.getAppointments();
        res.json(appointments);
      }
    } catch (error) {
      res.status(500).json({ error: "Error fetching appointments" });
    }
  });

  app.get("/api/patients/:patientId/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error fetching appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const parsed = insertAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const appointment = await storage.createAppointment(parsed.data);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Error creating appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Error updating appointment" });
    }
  });

  // Users/Doctors
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  return httpServer;
}
