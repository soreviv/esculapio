/**
 * HL7 FHIR R4 API Routes
 * Endpoints RESTful conformes al estándar FHIR para interoperabilidad
 */

import { Router, Request, Response } from "express";
import { storage } from "./storage";
import {
  patientToFhir,
  userToPractitioner,
  medicalNoteToEncounter,
  diagnosisToCondition,
  vitalsToObservations,
  prescriptionToMedicationRequest,
  labOrderToServiceRequest,
  consentToFhir,
  auditLogToAuditEvent,
  createPatientBundle,
  getCapabilityStatement,
} from "../shared/fhir-mappers";
import type {
  FhirBundle,
  FhirOperationOutcome,
  FhirResource,
} from "../shared/fhir-types";

const fhirRouter = Router();

// =====================
// Middleware
// =====================

// Set FHIR content type
fhirRouter.use((req, res, next) => {
  res.setHeader("Content-Type", "application/fhir+json; charset=utf-8");
  next();
});

// =====================
// Helper Functions
// =====================

function createOperationOutcome(
  severity: "error" | "warning" | "information",
  code: string,
  message: string
): FhirOperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity,
        code,
        diagnostics: message,
      },
    ],
  };
}

function createSearchBundle(
  resources: FhirResource[],
  total: number,
  baseUrl: string
): FhirBundle {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total,
    timestamp: new Date().toISOString(),
    entry: resources.map((resource) => ({
      fullUrl: `${baseUrl}/${resource.resourceType}/${resource.id}`,
      resource,
      search: {
        mode: "match",
      },
    })),
  };
}

// =====================
// CapabilityStatement (metadata)
// =====================

fhirRouter.get("/metadata", (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;
  res.json(getCapabilityStatement(baseUrl));
});

// =====================
// Patient Resource
// =====================

// GET /fhir/Patient - Search patients
fhirRouter.get("/Patient", async (req: Request, res: Response) => {
  try {
    const { identifier, name, birthdate, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    let patients = await storage.getPatients();

    // Filter by identifier (CURP or expediente)
    if (identifier) {
      const idValue = (identifier as string).split("|").pop() || identifier;
      patients = patients.filter(
        (p) =>
          p.curp?.includes(idValue as string) ||
          p.numeroExpediente?.includes(idValue as string)
      );
    }

    // Filter by name
    if (name) {
      const searchName = (name as string).toLowerCase();
      patients = patients.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchName) ||
          p.apellidoPaterno.toLowerCase().includes(searchName) ||
          p.apellidoMaterno?.toLowerCase().includes(searchName)
      );
    }

    // Filter by birthdate
    if (birthdate) {
      patients = patients.filter((p) => p.fechaNacimiento === birthdate);
    }

    const fhirPatients = patients.slice(0, limit).map(patientToFhir);
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(fhirPatients, fhirPatients.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/Patient/:id - Read patient
fhirRouter.get("/Patient/:id", async (req: Request, res: Response) => {
  try {
    const patient = await storage.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Patient/${req.params.id} not found`)
      );
    }
    res.json(patientToFhir(patient));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/Patient/:id/$everything - Patient complete record
fhirRouter.get("/Patient/:id/\\$everything", async (req: Request, res: Response) => {
  try {
    const patient = await storage.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Patient/${req.params.id} not found`)
      );
    }

    const [notes, vitals, prescriptions, labOrders, consents] = await Promise.all([
      storage.getPatientNotes(req.params.id),
      storage.getPatientVitals(req.params.id),
      storage.getPatientPrescriptions(req.params.id),
      storage.getPatientLabOrders(req.params.id),
      storage.getPatientConsents(req.params.id),
    ]);

    const bundle = createPatientBundle(
      patient,
      notes,
      vitals,
      prescriptions,
      labOrders,
      consents
    );

    res.json(bundle);
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// Practitioner Resource
// =====================

// GET /fhir/Practitioner - Search practitioners
fhirRouter.get("/Practitioner", async (req: Request, res: Response) => {
  try {
    const { identifier, name } = req.query;
    let users = await storage.getUsers();

    // Filter by role (only medical staff)
    users = users.filter((u) => ["admin", "medico", "enfermeria"].includes(u.role));

    if (identifier) {
      const idValue = (identifier as string).split("|").pop() || identifier;
      users = users.filter((u) => u.cedula?.includes(idValue as string));
    }

    if (name) {
      const searchName = (name as string).toLowerCase();
      users = users.filter((u) => u.nombre.toLowerCase().includes(searchName));
    }

    const practitioners = users.map(userToPractitioner);
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(practitioners, practitioners.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/Practitioner/:id
fhirRouter.get("/Practitioner/:id", async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Practitioner/${req.params.id} not found`)
      );
    }
    res.json(userToPractitioner(user));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// Encounter Resource
// =====================

// GET /fhir/Encounter - Search encounters
fhirRouter.get("/Encounter", async (req: Request, res: Response) => {
  try {
    const { patient, date, status, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    const patientData = await storage.getPatient(patientId);
    
    if (!patientData) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Patient/${patientId} not found`)
      );
    }

    let notes = await storage.getPatientNotes(patientId);

    if (date) {
      const searchDate = new Date(date as string).toISOString().split("T")[0];
      notes = notes.filter(
        (n) => new Date(n.fecha).toISOString().split("T")[0] === searchDate
      );
    }

    if (status) {
      const isFinished = status === "finished";
      notes = notes.filter((n) => n.firmada === isFinished);
    }

    const encounters = notes
      .slice(0, limit)
      .map((note) => medicalNoteToEncounter(note, patientData));
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(encounters, encounters.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/Encounter/:id
fhirRouter.get("/Encounter/:id", async (req: Request, res: Response) => {
  try {
    const note = await storage.getNote(req.params.id);
    if (!note) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Encounter/${req.params.id} not found`)
      );
    }

    const patient = await storage.getPatient(note.patientId);
    if (!patient) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", "Associated patient not found")
      );
    }

    res.json(medicalNoteToEncounter(note, patient));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// Condition Resource
// =====================

// GET /fhir/Condition - Search conditions
fhirRouter.get("/Condition", async (req: Request, res: Response) => {
  try {
    const { patient, code, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    const notes = await storage.getMedicalNotesWithDetails(patientId);

    const conditions: FhirResource[] = [];

    notes.forEach((note) => {
      if (note.diagnosticos && note.diagnosticos.length > 0) {
        note.diagnosticos.forEach((dx) => {
          // Filter by code if provided
          if (code && !dx.codigo.includes(code as string)) {
            return;
          }

          conditions.push(
            diagnosisToCondition(
              dx.codigo,
              dx.descripcion,
              patientId,
              note.id,
              new Date(note.fecha)
            )
          );
        });
      }
    });

    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;
    res.json(createSearchBundle(conditions.slice(0, limit), conditions.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// Observation Resource
// =====================

// GET /fhir/Observation - Search observations
fhirRouter.get("/Observation", async (req: Request, res: Response) => {
  try {
    const { patient, category, date, code, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    let vitals = await storage.getPatientVitals(patientId);

    if (date) {
      const searchDate = new Date(date as string).toISOString().split("T")[0];
      vitals = vitals.filter(
        (v) => new Date(v.fecha).toISOString().split("T")[0] === searchDate
      );
    }

    const observations: FhirResource[] = [];
    vitals.forEach((v) => {
      const obs = vitalsToObservations(v, patientId);
      observations.push(...obs);
    });

    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;
    res.json(createSearchBundle(observations.slice(0, limit), observations.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/Observation/:id
fhirRouter.get("/Observation/:id", async (req: Request, res: Response) => {
  try {
    // Extract vitals ID from observation ID (format: vitalsId or vitalsId-component)
    const baseId = req.params.id.split("-")[0];
    const vitals = await storage.getVitalsById(baseId);
    
    if (!vitals) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Observation/${req.params.id} not found`)
      );
    }

    const observations = vitalsToObservations(vitals, vitals.patientId);
    const observation = observations.find((o) => o.id === req.params.id);

    if (!observation) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Observation/${req.params.id} not found`)
      );
    }

    res.json(observation);
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// MedicationRequest Resource
// =====================

// GET /fhir/MedicationRequest - Search medication requests
fhirRouter.get("/MedicationRequest", async (req: Request, res: Response) => {
  try {
    const { patient, status, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    let prescriptions = await storage.getPatientPrescriptions(patientId);

    if (status) {
      const statusMap: Record<string, string> = {
        active: "activa",
        completed: "completada",
        cancelled: "cancelada",
      };
      const internalStatus = statusMap[status as string];
      if (internalStatus) {
        prescriptions = prescriptions.filter((p) => p.status === internalStatus);
      }
    }

    const medicationRequests = prescriptions
      .slice(0, limit)
      .map((p) => prescriptionToMedicationRequest(p, patientId));
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(medicationRequests, medicationRequests.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/MedicationRequest/:id
fhirRouter.get("/MedicationRequest/:id", async (req: Request, res: Response) => {
  try {
    const prescription = await storage.getPrescription(req.params.id);
    if (!prescription) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `MedicationRequest/${req.params.id} not found`)
      );
    }
    res.json(prescriptionToMedicationRequest(prescription, prescription.patientId));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// ServiceRequest Resource
// =====================

// GET /fhir/ServiceRequest - Search service requests
fhirRouter.get("/ServiceRequest", async (req: Request, res: Response) => {
  try {
    const { patient, status, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    let labOrders = await storage.getPatientLabOrders(patientId);

    if (status) {
      const statusMap: Record<string, string> = {
        active: "pendiente",
        completed: "completada",
        revoked: "cancelada",
      };
      const internalStatus = statusMap[status as string];
      if (internalStatus) {
        labOrders = labOrders.filter((o) => o.status === internalStatus);
      }
    }

    const serviceRequests = labOrders
      .slice(0, limit)
      .map((o) => labOrderToServiceRequest(o, patientId));
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(serviceRequests, serviceRequests.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// GET /fhir/ServiceRequest/:id
fhirRouter.get("/ServiceRequest/:id", async (req: Request, res: Response) => {
  try {
    const labOrder = await storage.getLabOrder(req.params.id);
    if (!labOrder) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `ServiceRequest/${req.params.id} not found`)
      );
    }
    res.json(labOrderToServiceRequest(labOrder, labOrder.patientId));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// Consent Resource
// =====================

// GET /fhir/Consent - Search consents
fhirRouter.get("/Consent", async (req: Request, res: Response) => {
  try {
    const { patient, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    const consents = await storage.getPatientConsents(patientId);

    const fhirConsents = consents.slice(0, limit).map((c) => consentToFhir(c, patientId));
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(fhirConsents, fhirConsents.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// AuditEvent Resource
// =====================

// GET /fhir/AuditEvent - Search audit events
fhirRouter.get("/AuditEvent", async (req: Request, res: Response) => {
  try {
    const { date, agent, _count = "100" } = req.query;
    const limit = Math.min(parseInt(_count as string) || 100, 1000);

    let auditLogs = await storage.getAuditLogs(limit);

    if (date) {
      const searchDate = new Date(date as string).toISOString().split("T")[0];
      auditLogs = auditLogs.filter(
        (log) => log.fecha.toISOString().split("T")[0] === searchDate
      );
    }

    if (agent) {
      const agentId = (agent as string).replace("Practitioner/", "");
      auditLogs = auditLogs.filter((log) => log.userId === agentId);
    }

    const auditEvents = auditLogs.map(auditLogToAuditEvent);
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    res.json(createSearchBundle(auditEvents, auditEvents.length, baseUrl));
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

// =====================
// Export Bundle (All data for a patient)
// =====================

fhirRouter.get("/\\$export", async (req: Request, res: Response) => {
  try {
    const { patient } = req.query;

    if (!patient) {
      return res.status(400).json(
        createOperationOutcome("error", "required", "Patient parameter is required for export")
      );
    }

    const patientId = (patient as string).replace("Patient/", "");
    const patientData = await storage.getPatient(patientId);

    if (!patientData) {
      return res.status(404).json(
        createOperationOutcome("error", "not-found", `Patient/${patientId} not found`)
      );
    }

    const [notes, vitals, prescriptions, labOrders, consents] = await Promise.all([
      storage.getMedicalNotesWithDetails(patientId),
      storage.getPatientVitals(patientId),
      storage.getPatientPrescriptions(patientId),
      storage.getPatientLabOrders(patientId),
      storage.getPatientConsents(patientId),
    ]);

    const bundle = createPatientBundle(
      patientData,
      notes,
      vitals,
      prescriptions,
      labOrders,
      consents
    );

    // Set filename for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expediente-${patientData.numeroExpediente}-fhir.json"`
    );

    res.json(bundle);
  } catch (error) {
    res.status(500).json(createOperationOutcome("error", "exception", String(error)));
  }
});

export default fhirRouter;
