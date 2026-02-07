/**
 * FHIR R4 Mappers - Transformadores entre modelo interno y FHIR
 * Convierte datos del sistema a formato HL7 FHIR R4 estándar
 */

import type {
  Patient,
  User,
  MedicalNote,
  Vitals,
  Prescription,
  LabOrder,
  PatientConsent,
  AuditLog,
} from "./schema";

import type {
  FhirPatient,
  FhirPractitioner,
  FhirEncounter,
  FhirCondition,
  FhirObservation,
  FhirMedicationRequest,
  FhirServiceRequest,
  FhirConsent,
  FhirAuditEvent,
  FhirBundle,
  FhirCapabilityStatement,
  FhirCodeableConcept,
  FhirIdentifier,
} from "./fhir-types";

// =====================
// Constantes y Sistemas
// =====================

const SYSTEM_CURP = "urn:oid:2.16.840.1.113883.4.629"; // OID México CURP
const SYSTEM_CEDULA = "urn:oid:2.16.840.1.113883.3.215"; // Cédula profesional
const SYSTEM_CIE10 = "http://hl7.org/fhir/sid/icd-10";
const SYSTEM_LOINC = "http://loinc.org";
const SYSTEM_SNOMED = "http://snomed.info/sct";
const SYSTEM_LOCAL = "http://salud-digital.mx/fhir";

// =====================
// Patient Mapper
// =====================

export function patientToFhir(patient: Patient): FhirPatient {
  const identifiers: FhirIdentifier[] = [
    {
      use: "official",
      system: `${SYSTEM_LOCAL}/expediente`,
      value: patient.numeroExpediente,
    },
  ];

  if (patient.curp) {
    identifiers.push({
      use: "official",
      system: SYSTEM_CURP,
      value: patient.curp,
    });
  }

  const fhirPatient: FhirPatient = {
    resourceType: "Patient",
    id: patient.id,
    meta: {
      lastUpdated: patient.createdAt?.toISOString() || new Date().toISOString(),
      profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"],
    },
    identifier: identifiers,
    active: patient.status === "activo",
    name: [
      {
        use: "official",
        family: `${patient.apellidoPaterno}${patient.apellidoMaterno ? ` ${patient.apellidoMaterno}` : ""}`,
        given: [patient.nombre],
        text: `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ""}`.trim(),
      },
    ],
    gender: patient.sexo === "M" ? "male" : "female",
    birthDate: patient.fechaNacimiento,
    telecom: [],
    address: [],
    extension: [],
  };

  // Teléfono
  if (patient.telefono) {
    fhirPatient.telecom!.push({
      system: "phone",
      value: patient.telefono,
      use: "home",
    });
  }

  // Email
  if (patient.email) {
    fhirPatient.telecom!.push({
      system: "email",
      value: patient.email,
    });
  }

  // Dirección
  if (patient.direccion) {
    fhirPatient.address!.push({
      use: "home",
      type: "physical",
      text: patient.direccion,
    });
  }

  // Estado civil
  if (patient.estadoCivil) {
    fhirPatient.maritalStatus = {
      text: patient.estadoCivil,
    };
  }

  // Contacto de emergencia
  if (patient.contactoEmergencia) {
    fhirPatient.contact = [
      {
        relationship: [{ text: "Contacto de emergencia" }],
        name: { text: patient.contactoEmergencia },
        telecom: patient.telefonoEmergencia
          ? [{ system: "phone", value: patient.telefonoEmergencia }]
          : undefined,
      },
    ];
  }

  // Extensiones mexicanas
  if (patient.lugarNacimiento) {
    fhirPatient.extension!.push({
      url: `${SYSTEM_LOCAL}/birthplace`,
      valueString: patient.lugarNacimiento,
    });
  }

  if (patient.ocupacion) {
    fhirPatient.extension!.push({
      url: `${SYSTEM_LOCAL}/occupation`,
      valueString: patient.ocupacion,
    });
  }

  if (patient.escolaridad) {
    fhirPatient.extension!.push({
      url: `${SYSTEM_LOCAL}/education`,
      valueString: patient.escolaridad,
    });
  }

  if (patient.religion) {
    fhirPatient.extension!.push({
      url: `${SYSTEM_LOCAL}/religion`,
      valueString: patient.religion,
    });
  }

  if (patient.grupoSanguineo) {
    fhirPatient.extension!.push({
      url: `${SYSTEM_LOCAL}/blood-type`,
      valueString: patient.grupoSanguineo,
    });
  }

  // Alergias como extensión
  if (patient.alergias && patient.alergias.length > 0) {
    fhirPatient.extension!.push({
      url: `${SYSTEM_LOCAL}/allergies`,
      valueString: patient.alergias.join(", "),
    });
  }

  return fhirPatient;
}

// =====================
// Practitioner Mapper
// =====================

export function userToPractitioner(user: User): FhirPractitioner {
  const practitioner: FhirPractitioner = {
    resourceType: "Practitioner",
    id: user.id,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    identifier: [],
    active: true,  // Schema doesn't have 'activo' field for users
    name: [
      {
        use: "official",
        text: user.nombre,
      },
    ],
  };

  if (user.cedula) {
    practitioner.identifier!.push({
      use: "official",
      system: SYSTEM_CEDULA,
      value: user.cedula,
    });
  }

  if (user.especialidad) {
    practitioner.qualification = [
      {
        code: {
          text: user.especialidad,
        },
      },
    ];
  }

  return practitioner;
}

// =====================
// Encounter Mapper (Nota Médica como Encuentro)
// =====================

export function medicalNoteToEncounter(
  note: MedicalNote,
  patient: Patient
): FhirEncounter {
  const encounter: FhirEncounter = {
    resourceType: "Encounter",
    id: note.id,
    meta: {
      lastUpdated: note.createdAt?.toISOString() || new Date().toISOString(),
    },
    identifier: [
      {
        system: `${SYSTEM_LOCAL}/encounter`,
        value: note.id,
      },
    ],
    status: note.firmada ? "finished" : "in-progress",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    type: [
      {
        coding: [
          {
            system: `${SYSTEM_LOCAL}/note-type`,
            code: note.tipo,
            display: getNoteTypeDisplay(note.tipo),
          },
        ],
      },
    ],
    subject: {
      reference: `Patient/${patient.id}`,
      display: `${patient.nombre} ${patient.apellidoPaterno}`,
    },
    participant: [
      {
        type: [{ text: "Médico tratante" }],
        individual: {
          reference: `Practitioner/${note.medicoId}`,
        },
      },
    ],
    period: {
      start: new Date(note.fecha).toISOString(),
      end: note.firmada && note.fechaFirma 
        ? new Date(note.fechaFirma).toISOString() 
        : undefined,
    },
    reasonCode: note.motivoConsulta
      ? [{ text: note.motivoConsulta }]
      : undefined,
  };

  return encounter;
}

function getNoteTypeDisplay(tipo: string): string {
  const types: Record<string, string> = {
    historia_clinica: "Historia Clínica",
    nota_inicial: "Nota de Primera Vez",
    nota_evolucion: "Nota de Evolución",
    nota_interconsulta: "Interconsulta",
    nota_referencia: "Nota de Referencia",
    nota_egreso: "Nota de Egreso",
  };
  return types[tipo] || tipo;
}

// =====================
// Condition Mapper (Diagnóstico)
// =====================

export function diagnosisToCondition(
  codigo: string,
  descripcion: string,
  patientId: string,
  encounterId: string,
  noteDate: Date
): FhirCondition {
  return {
    resourceType: "Condition",
    id: `${encounterId}-${codigo}`,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: "active",
          display: "Active",
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: "confirmed",
          display: "Confirmed",
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-category",
            code: "encounter-diagnosis",
            display: "Encounter Diagnosis",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: SYSTEM_CIE10,
          code: codigo,
          display: descripcion,
        },
      ],
      text: descripcion,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    encounter: {
      reference: `Encounter/${encounterId}`,
    },
    recordedDate: noteDate.toISOString(),
  };
}

// =====================
// Observation Mapper (Signos Vitales)
// =====================

export function vitalsToObservations(
  vitals: Vitals,
  patientId: string
): FhirObservation[] {
  const observations: FhirObservation[] = [];
  const baseDate = new Date(vitals.fecha).toISOString();

  // Panel de signos vitales
  const vitalSignsPanel: FhirObservation = {
    resourceType: "Observation",
    id: vitals.id,
    meta: {
      lastUpdated: baseDate,
      profile: ["http://hl7.org/fhir/StructureDefinition/vitalsigns"],
    },
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: SYSTEM_LOINC,
          code: "85353-1",
          display: "Vital signs, weight, height, head circumference, oxygen saturation and BMI panel",
        },
      ],
      text: "Panel de Signos Vitales",
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    effectiveDateTime: baseDate,
    hasMember: [],
  };

  // Presión arterial (componentes)
  if (vitals.presionSistolica || vitals.presionDiastolica) {
    const bpObs: FhirObservation = {
      resourceType: "Observation",
      id: `${vitals.id}-bp`,
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: SYSTEM_LOINC,
            code: "85354-9",
            display: "Blood pressure panel",
          },
        ],
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: baseDate,
      component: [],
    };

    if (vitals.presionSistolica) {
      bpObs.component!.push({
        code: {
          coding: [
            {
              system: SYSTEM_LOINC,
              code: "8480-6",
              display: "Systolic blood pressure",
            },
          ],
        },
        valueQuantity: {
          value: vitals.presionSistolica,
          unit: "mmHg",
          system: "http://unitsofmeasure.org",
          code: "mm[Hg]",
        },
      });
    }

    if (vitals.presionDiastolica) {
      bpObs.component!.push({
        code: {
          coding: [
            {
              system: SYSTEM_LOINC,
              code: "8462-4",
              display: "Diastolic blood pressure",
            },
          ],
        },
        valueQuantity: {
          value: vitals.presionDiastolica,
          unit: "mmHg",
          system: "http://unitsofmeasure.org",
          code: "mm[Hg]",
        },
      });
    }

    observations.push(bpObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${bpObs.id}` });
  }

  // Frecuencia cardíaca
  if (vitals.frecuenciaCardiaca) {
    const hrObs = createSimpleObservation(
      `${vitals.id}-hr`,
      patientId,
      baseDate,
      "8867-4",
      "Heart rate",
      vitals.frecuenciaCardiaca,
      "/min",
      "{beats}/min"
    );
    observations.push(hrObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${hrObs.id}` });
  }

  // Frecuencia respiratoria
  if (vitals.frecuenciaRespiratoria) {
    const rrObs = createSimpleObservation(
      `${vitals.id}-rr`,
      patientId,
      baseDate,
      "9279-1",
      "Respiratory rate",
      vitals.frecuenciaRespiratoria,
      "/min",
      "{breaths}/min"
    );
    observations.push(rrObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${rrObs.id}` });
  }

  // Temperatura
  if (vitals.temperatura) {
    const tempObs = createSimpleObservation(
      `${vitals.id}-temp`,
      patientId,
      baseDate,
      "8310-5",
      "Body temperature",
      parseFloat(vitals.temperatura),
      "°C",
      "Cel"
    );
    observations.push(tempObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${tempObs.id}` });
  }

  // Saturación de oxígeno
  if (vitals.saturacionOxigeno) {
    const spo2Obs = createSimpleObservation(
      `${vitals.id}-spo2`,
      patientId,
      baseDate,
      "59408-5",
      "Oxygen saturation",
      parseFloat(vitals.saturacionOxigeno),
      "%",
      "%"
    );
    observations.push(spo2Obs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${spo2Obs.id}` });
  }

  // Peso
  if (vitals.peso) {
    const weightObs = createSimpleObservation(
      `${vitals.id}-weight`,
      patientId,
      baseDate,
      "29463-7",
      "Body weight",
      parseFloat(vitals.peso),
      "kg",
      "kg"
    );
    observations.push(weightObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${weightObs.id}` });
  }

  // Talla
  if (vitals.talla) {
    const heightObs = createSimpleObservation(
      `${vitals.id}-height`,
      patientId,
      baseDate,
      "8302-2",
      "Body height",
      parseFloat(vitals.talla),
      "cm",
      "cm"
    );
    observations.push(heightObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${heightObs.id}` });
  }

  // Glucosa
  if (vitals.glucosa) {
    const glucoseObs = createSimpleObservation(
      `${vitals.id}-glucose`,
      patientId,
      baseDate,
      "2339-0",
      "Glucose [Mass/volume] in Blood",
      parseFloat(vitals.glucosa),
      "mg/dL",
      "mg/dL"
    );
    observations.push(glucoseObs);
    vitalSignsPanel.hasMember!.push({ reference: `Observation/${glucoseObs.id}` });
  }

  observations.unshift(vitalSignsPanel);
  return observations;
}

function createSimpleObservation(
  id: string,
  patientId: string,
  date: string,
  loincCode: string,
  display: string,
  value: number,
  unit: string,
  ucumCode: string
): FhirObservation {
  return {
    resourceType: "Observation",
    id,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: SYSTEM_LOINC,
          code: loincCode,
          display,
        },
      ],
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: date,
    valueQuantity: {
      value,
      unit,
      system: "http://unitsofmeasure.org",
      code: ucumCode,
    },
  };
}

// =====================
// MedicationRequest Mapper (Receta)
// =====================

export function prescriptionToMedicationRequest(
  prescription: Prescription,
  patientId: string
): FhirMedicationRequest {
  const statusMap: Record<string, "active" | "completed" | "cancelled"> = {
    activa: "active",
    completada: "completed",
    cancelada: "cancelled",
  };

  return {
    resourceType: "MedicationRequest",
    id: prescription.id,
    meta: {
      lastUpdated: prescription.updatedAt?.toISOString() || new Date().toISOString(),
    },
    identifier: [
      {
        system: `${SYSTEM_LOCAL}/prescription`,
        value: prescription.id,
      },
    ],
    status: statusMap[prescription.status] || "active",
    intent: "order",
    medicationCodeableConcept: {
      text: prescription.medicamento,
      coding: prescription.presentacion
        ? [
            {
              system: `${SYSTEM_LOCAL}/medication`,
              display: `${prescription.medicamento} ${prescription.presentacion}`,
            },
          ]
        : undefined,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    authoredOn: prescription.createdAt?.toISOString(),
    requester: {
      reference: `Practitioner/${prescription.medicoId}`,
    },
    dosageInstruction: [
      {
        text: `${prescription.dosis} ${prescription.via} cada ${prescription.frecuencia}${prescription.duracion ? ` por ${prescription.duracion}` : ""}`,
        route: {
          text: prescription.via,
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: parseFloat(prescription.dosis) || undefined,
              unit: prescription.dosis,
            },
          },
        ],
        timing: {
          code: {
            text: prescription.frecuencia,
          },
        },
      },
    ],
    note: prescription.indicaciones
      ? [{ text: prescription.indicaciones }]
      : undefined,
  };
}

// =====================
// ServiceRequest Mapper (Orden de Laboratorio)
// =====================

export function labOrderToServiceRequest(
  labOrder: LabOrder,
  patientId: string,
  diagnosticoCie10?: { codigo: string; descripcion: string }[]
): FhirServiceRequest {
  const statusMap: Record<string, "active" | "completed" | "revoked" | "draft"> = {
    pendiente: "active",
    en_proceso: "active",
    completada: "completed",
    cancelada: "revoked",
  };

  const serviceRequest: FhirServiceRequest = {
    resourceType: "ServiceRequest",
    id: labOrder.id,
    meta: {
      lastUpdated: labOrder.updatedAt?.toISOString() || new Date().toISOString(),
    },
    identifier: [
      {
        system: `${SYSTEM_LOCAL}/lab-order`,
        value: labOrder.id,
      },
    ],
    status: statusMap[labOrder.status] || "active",
    intent: "order",
    priority: labOrder.urgente ? "urgent" : "routine",
    category: [
      {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "108252007",
            display: "Laboratory procedure",
          },
        ],
      },
    ],
    code: {
      text: labOrder.estudios.join(", "),
    },
    orderDetail: labOrder.estudios.map((estudio) => ({
      text: estudio,
    })),
    subject: {
      reference: `Patient/${patientId}`,
    },
    authoredOn: labOrder.createdAt?.toISOString(),
    requester: {
      reference: `Practitioner/${labOrder.medicoId}`,
    },
    reasonCode: diagnosticoCie10?.map((dx) => ({
      coding: [
        {
          system: SYSTEM_CIE10,
          code: dx.codigo,
          display: dx.descripcion,
        },
      ],
      text: dx.descripcion,
    })) || (labOrder.diagnosticoPresuntivo
      ? [{ text: labOrder.diagnosticoPresuntivo }]
      : undefined),
    note: labOrder.indicacionesClinicas
      ? [{ text: labOrder.indicacionesClinicas }]
      : undefined,
    patientInstruction: labOrder.ayuno
      ? "Presentarse en ayuno de 8 a 12 horas"
      : undefined,
  };

  return serviceRequest;
}

// =====================
// Consent Mapper
// =====================

export function consentToFhir(
  consent: PatientConsent,
  patientId: string
): FhirConsent {
  const scopeMap: Record<string, FhirCodeableConcept> = {
    privacidad: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent",
        },
      ],
    },
    atencion_consulta: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "treatment",
          display: "Treatment",
        },
      ],
    },
    procedimiento: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "treatment",
          display: "Treatment",
        },
      ],
    },
    expediente_electronico: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent",
        },
      ],
    },
  };

  return {
    resourceType: "Consent",
    id: consent.id,
    meta: {
      lastUpdated: consent.fechaAceptacion?.toISOString() || new Date().toISOString(),
    },
    status: consent.aceptado ? "active" : "proposed",
    scope: scopeMap[consent.tipoConsentimiento] || scopeMap.atencion_consulta,
    category: [
      {
        coding: [
          {
            system: `${SYSTEM_LOCAL}/consent-type`,
            code: consent.tipoConsentimiento,
            display: consent.tipoConsentimiento.replace(/_/g, " "),
          },
        ],
      },
    ],
    patient: {
      reference: `Patient/${patientId}`,
    },
    dateTime: consent.fechaAceptacion?.toISOString(),
    performer: consent.nombreFirmante
      ? [{ display: consent.nombreFirmante }]
      : undefined,
    policyRule: {
      coding: [
        {
          system: `${SYSTEM_LOCAL}/policy`,
          code: "nom-004",
          display: "NOM-004-SSA3-2012",
        },
      ],
    },
  };
}

// =====================
// AuditEvent Mapper
// =====================

export function auditLogToAuditEvent(auditLog: AuditLog): FhirAuditEvent {
  const actionMap: Record<string, "C" | "R" | "U" | "D" | "E"> = {
    create: "C",
    read: "R",
    update: "U",
    delete: "D",
    login: "E",
    logout: "E",
    sign: "U",
  };

  return {
    resourceType: "AuditEvent",
    id: auditLog.id,
    type: {
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "110110",
      display: "Patient Record",
    },
    subtype: [
      {
        system: `${SYSTEM_LOCAL}/audit-action`,
        code: auditLog.action,
        display: auditLog.action,
      },
    ],
    action: actionMap[auditLog.action] || "E",
    recorded: auditLog.timestamp.toISOString(),
    outcome: "0",
    agent: [
      {
        who: {
          reference: `Practitioner/${auditLog.userId}`,
        },
        requestor: true,
        network: auditLog.ipAddress
          ? {
              address: auditLog.ipAddress,
              type: "2",
            }
          : undefined,
      },
    ],
    source: {
      site: "Salud Digital EHR",
      observer: {
        display: "Sistema de Expediente Clínico Electrónico",
      },
    },
    entity: auditLog.resourceId
      ? [
          {
            what: {
              reference: `${auditLog.resourceType}/${auditLog.resourceId}`,
            },
            type: {
              system: "http://terminology.hl7.org/CodeSystem/audit-entity-type",
              code: "2",
              display: "System Object",
            },
          },
        ]
      : undefined,
  };
}

// =====================
// Bundle Creator (Expediente completo)
// =====================

export function createPatientBundle(
  patient: Patient,
  notes: MedicalNote[],
  vitals: Vitals[],
  prescriptions: Prescription[],
  labOrders: LabOrder[],
  consents: PatientConsent[]
): FhirBundle {
  const entries: FhirBundle["entry"] = [];

  // Patient
  entries.push({
    fullUrl: `Patient/${patient.id}`,
    resource: patientToFhir(patient),
  });

  // Encounters y Conditions (de notas médicas)
  notes.forEach((note) => {
    entries.push({
      fullUrl: `Encounter/${note.id}`,
      resource: medicalNoteToEncounter(note, patient),
    });

    // Diagnósticos
    if (note.diagnosticosCie10 && note.diagnosticos) {
      note.diagnosticosCie10.forEach((codigo, index) => {
        const descripcion = note.diagnosticos?.[index] || codigo;
        entries.push({
          fullUrl: `Condition/${note.id}-${codigo}`,
          resource: diagnosisToCondition(
            codigo,
            descripcion,
            patient.id,
            note.id,
            new Date(note.fecha)
          ),
        });
      });
    }
  });

  // Observations (signos vitales)
  vitals.forEach((v) => {
    const observations = vitalsToObservations(v, patient.id);
    observations.forEach((obs) => {
      entries.push({
        fullUrl: `Observation/${obs.id}`,
        resource: obs,
      });
    });
  });

  // MedicationRequests
  prescriptions.forEach((rx) => {
    entries.push({
      fullUrl: `MedicationRequest/${rx.id}`,
      resource: prescriptionToMedicationRequest(rx, patient.id),
    });
  });

  // ServiceRequests
  labOrders.forEach((order) => {
    entries.push({
      fullUrl: `ServiceRequest/${order.id}`,
      resource: labOrderToServiceRequest(order, patient.id),
    });
  });

  // Consents
  consents.forEach((consent) => {
    entries.push({
      fullUrl: `Consent/${consent.id}`,
      resource: consentToFhir(consent, patient.id),
    });
  });

  return {
    resourceType: "Bundle",
    id: `patient-bundle-${patient.id}`,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    type: "collection",
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };
}

// =====================
// CapabilityStatement
// =====================

export function getCapabilityStatement(baseUrl: string): FhirCapabilityStatement {
  return {
    resourceType: "CapabilityStatement",
    id: "salud-digital-capability",
    url: `${baseUrl}/fhir/metadata`,
    version: "1.0.0",
    name: "SaludDigitalFHIRServer",
    title: "Salud Digital FHIR Server",
    status: "active",
    experimental: false,
    date: new Date().toISOString(),
    publisher: "Salud Digital",
    description: "Servidor FHIR R4 del Sistema de Expediente Clínico Electrónico Salud Digital. Cumple con NOM-024-SSA3-2012 y HL7 FHIR R4.",
    kind: "instance",
    software: {
      name: "Salud Digital EHR",
      version: "1.0.0",
    },
    implementation: {
      description: "Sistema de Expediente Clínico Electrónico conforme a normatividad mexicana",
      url: baseUrl,
    },
    fhirVersion: "4.0.1",
    format: ["application/fhir+json", "application/json"],
    rest: [
      {
        mode: "server",
        documentation: "API FHIR R4 para interoperabilidad de datos clínicos",
        security: {
          cors: true,
          description: "Autenticación mediante tokens de sesión",
        },
        resource: [
          {
            type: "Patient",
            profile: "http://hl7.org/fhir/StructureDefinition/Patient",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "identifier", type: "token" },
              { name: "name", type: "string" },
              { name: "birthdate", type: "date" },
            ],
          },
          {
            type: "Practitioner",
            profile: "http://hl7.org/fhir/StructureDefinition/Practitioner",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
          },
          {
            type: "Encounter",
            profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "patient", type: "reference" },
              { name: "date", type: "date" },
            ],
          },
          {
            type: "Condition",
            profile: "http://hl7.org/fhir/StructureDefinition/Condition",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "patient", type: "reference" },
              { name: "code", type: "token" },
            ],
          },
          {
            type: "Observation",
            profile: "http://hl7.org/fhir/StructureDefinition/Observation",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "patient", type: "reference" },
              { name: "category", type: "token" },
              { name: "date", type: "date" },
            ],
          },
          {
            type: "MedicationRequest",
            profile: "http://hl7.org/fhir/StructureDefinition/MedicationRequest",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "patient", type: "reference" },
              { name: "status", type: "token" },
            ],
          },
          {
            type: "ServiceRequest",
            profile: "http://hl7.org/fhir/StructureDefinition/ServiceRequest",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "patient", type: "reference" },
              { name: "status", type: "token" },
            ],
          },
          {
            type: "Consent",
            profile: "http://hl7.org/fhir/StructureDefinition/Consent",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "patient", type: "reference" },
            ],
          },
          {
            type: "AuditEvent",
            profile: "http://hl7.org/fhir/StructureDefinition/AuditEvent",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
          },
        ],
        interaction: [
          { code: "search-system" },
        ],
      },
    ],
  };
}
