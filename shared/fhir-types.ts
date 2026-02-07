/**
 * HL7 FHIR R4 Type Definitions
 * Conformidad con estándar internacional de interoperabilidad en salud
 * Referencia: https://hl7.org/fhir/R4/
 */

// =====================
// Base FHIR Types
// =====================

export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
}

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
}

export interface FhirIdentifier {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  type?: FhirCodeableConcept;
  system?: string;
  value?: string;
  period?: FhirPeriod;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirReference {
  reference?: string;
  type?: string;
  identifier?: FhirIdentifier;
  display?: string;
}

export interface FhirHumanName {
  use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: FhirPeriod;
}

export interface FhirContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
  period?: FhirPeriod;
}

export interface FhirAddress {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: FhirPeriod;
}

export interface FhirQuantity {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirAnnotation {
  authorReference?: FhirReference;
  authorString?: string;
  time?: string;
  text: string;
}

// =====================
// FHIR Resources
// =====================

// Patient Resource (Paciente)
export interface FhirPatient extends FhirResource {
  resourceType: "Patient";
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FhirAddress[];
  maritalStatus?: FhirCodeableConcept;
  contact?: FhirPatientContact[];
  communication?: FhirPatientCommunication[];
  generalPractitioner?: FhirReference[];
  managingOrganization?: FhirReference;
  extension?: FhirExtension[];
}

export interface FhirPatientContact {
  relationship?: FhirCodeableConcept[];
  name?: FhirHumanName;
  telecom?: FhirContactPoint[];
  address?: FhirAddress;
  gender?: "male" | "female" | "other" | "unknown";
  organization?: FhirReference;
  period?: FhirPeriod;
}

export interface FhirPatientCommunication {
  language: FhirCodeableConcept;
  preferred?: boolean;
}

export interface FhirExtension {
  url: string;
  valueString?: string;
  valueCode?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueDateTime?: string;
  valueCodeableConcept?: FhirCodeableConcept;
}

// Practitioner Resource (Profesional de salud)
export interface FhirPractitioner extends FhirResource {
  resourceType: "Practitioner";
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  address?: FhirAddress[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  qualification?: FhirPractitionerQualification[];
}

export interface FhirPractitionerQualification {
  identifier?: FhirIdentifier[];
  code: FhirCodeableConcept;
  period?: FhirPeriod;
  issuer?: FhirReference;
}

// Encounter Resource (Consulta/Encuentro)
export interface FhirEncounter extends FhirResource {
  resourceType: "Encounter";
  identifier?: FhirIdentifier[];
  status: "planned" | "arrived" | "triaged" | "in-progress" | "onleave" | "finished" | "cancelled" | "entered-in-error" | "unknown";
  class: FhirCoding;
  type?: FhirCodeableConcept[];
  serviceType?: FhirCodeableConcept;
  priority?: FhirCodeableConcept;
  subject?: FhirReference;
  participant?: FhirEncounterParticipant[];
  period?: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  diagnosis?: FhirEncounterDiagnosis[];
  hospitalization?: FhirEncounterHospitalization;
  location?: FhirEncounterLocation[];
  serviceProvider?: FhirReference;
}

export interface FhirEncounterParticipant {
  type?: FhirCodeableConcept[];
  period?: FhirPeriod;
  individual?: FhirReference;
}

export interface FhirEncounterDiagnosis {
  condition: FhirReference;
  use?: FhirCodeableConcept;
  rank?: number;
}

export interface FhirEncounterHospitalization {
  preAdmissionIdentifier?: FhirIdentifier;
  origin?: FhirReference;
  admitSource?: FhirCodeableConcept;
  reAdmission?: FhirCodeableConcept;
  dietPreference?: FhirCodeableConcept[];
  specialCourtesy?: FhirCodeableConcept[];
  specialArrangement?: FhirCodeableConcept[];
  destination?: FhirReference;
  dischargeDisposition?: FhirCodeableConcept;
}

export interface FhirEncounterLocation {
  location: FhirReference;
  status?: "planned" | "active" | "reserved" | "completed";
  physicalType?: FhirCodeableConcept;
  period?: FhirPeriod;
}

// Condition Resource (Diagnóstico/Condición)
export interface FhirCondition extends FhirResource {
  resourceType: "Condition";
  identifier?: FhirIdentifier[];
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  bodySite?: FhirCodeableConcept[];
  subject: FhirReference;
  encounter?: FhirReference;
  onsetDateTime?: string;
  onsetAge?: FhirQuantity;
  onsetPeriod?: FhirPeriod;
  onsetRange?: FhirRange;
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: FhirQuantity;
  abatementPeriod?: FhirPeriod;
  abatementRange?: FhirRange;
  abatementString?: string;
  recordedDate?: string;
  recorder?: FhirReference;
  asserter?: FhirReference;
  stage?: FhirConditionStage[];
  evidence?: FhirConditionEvidence[];
  note?: FhirAnnotation[];
}

export interface FhirRange {
  low?: FhirQuantity;
  high?: FhirQuantity;
}

export interface FhirConditionStage {
  summary?: FhirCodeableConcept;
  assessment?: FhirReference[];
  type?: FhirCodeableConcept;
}

export interface FhirConditionEvidence {
  code?: FhirCodeableConcept[];
  detail?: FhirReference[];
}

// Observation Resource (Signos vitales, resultados)
export interface FhirObservation extends FhirResource {
  resourceType: "Observation";
  identifier?: FhirIdentifier[];
  basedOn?: FhirReference[];
  partOf?: FhirReference[];
  status: "registered" | "preliminary" | "final" | "amended" | "corrected" | "cancelled" | "entered-in-error" | "unknown";
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  focus?: FhirReference[];
  encounter?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: FhirPeriod;
  issued?: string;
  performer?: FhirReference[];
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: FhirRange;
  valueRatio?: FhirRatio;
  dataAbsentReason?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
  bodySite?: FhirCodeableConcept;
  method?: FhirCodeableConcept;
  specimen?: FhirReference;
  device?: FhirReference;
  referenceRange?: FhirObservationReferenceRange[];
  hasMember?: FhirReference[];
  derivedFrom?: FhirReference[];
  component?: FhirObservationComponent[];
}

export interface FhirRatio {
  numerator?: FhirQuantity;
  denominator?: FhirQuantity;
}

export interface FhirObservationReferenceRange {
  low?: FhirQuantity;
  high?: FhirQuantity;
  type?: FhirCodeableConcept;
  appliesTo?: FhirCodeableConcept[];
  age?: FhirRange;
  text?: string;
}

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: FhirRange;
  valueRatio?: FhirRatio;
  dataAbsentReason?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: FhirObservationReferenceRange[];
}

// MedicationRequest Resource (Receta)
export interface FhirMedicationRequest extends FhirResource {
  resourceType: "MedicationRequest";
  identifier?: FhirIdentifier[];
  status: "active" | "on-hold" | "cancelled" | "completed" | "entered-in-error" | "stopped" | "draft" | "unknown";
  statusReason?: FhirCodeableConcept;
  intent: "proposal" | "plan" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
  category?: FhirCodeableConcept[];
  priority?: "routine" | "urgent" | "asap" | "stat";
  doNotPerform?: boolean;
  reportedBoolean?: boolean;
  reportedReference?: FhirReference;
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: FhirReference;
  subject: FhirReference;
  encounter?: FhirReference;
  supportingInformation?: FhirReference[];
  authoredOn?: string;
  requester?: FhirReference;
  performer?: FhirReference;
  performerType?: FhirCodeableConcept;
  recorder?: FhirReference;
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  courseOfTherapyType?: FhirCodeableConcept;
  insurance?: FhirReference[];
  note?: FhirAnnotation[];
  dosageInstruction?: FhirDosage[];
  dispenseRequest?: FhirMedicationRequestDispenseRequest;
  substitution?: FhirMedicationRequestSubstitution;
}

export interface FhirDosage {
  sequence?: number;
  text?: string;
  additionalInstruction?: FhirCodeableConcept[];
  patientInstruction?: string;
  timing?: FhirTiming;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: FhirCodeableConcept;
  site?: FhirCodeableConcept;
  route?: FhirCodeableConcept;
  method?: FhirCodeableConcept;
  doseAndRate?: FhirDosageDoseAndRate[];
  maxDosePerPeriod?: FhirRatio;
  maxDosePerAdministration?: FhirQuantity;
  maxDosePerLifetime?: FhirQuantity;
}

export interface FhirTiming {
  event?: string[];
  repeat?: FhirTimingRepeat;
  code?: FhirCodeableConcept;
}

export interface FhirTimingRepeat {
  boundsDuration?: FhirQuantity;
  boundsPeriod?: FhirPeriod;
  boundsRange?: FhirRange;
  count?: number;
  countMax?: number;
  duration?: number;
  durationMax?: number;
  durationUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  frequency?: number;
  frequencyMax?: number;
  period?: number;
  periodMax?: number;
  periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  dayOfWeek?: string[];
  timeOfDay?: string[];
  when?: string[];
  offset?: number;
}

export interface FhirDosageDoseAndRate {
  type?: FhirCodeableConcept;
  doseRange?: FhirRange;
  doseQuantity?: FhirQuantity;
  rateRatio?: FhirRatio;
  rateRange?: FhirRange;
  rateQuantity?: FhirQuantity;
}

export interface FhirMedicationRequestDispenseRequest {
  initialFill?: {
    quantity?: FhirQuantity;
    duration?: FhirQuantity;
  };
  dispenseInterval?: FhirQuantity;
  validityPeriod?: FhirPeriod;
  numberOfRepeatsAllowed?: number;
  quantity?: FhirQuantity;
  expectedSupplyDuration?: FhirQuantity;
  performer?: FhirReference;
}

export interface FhirMedicationRequestSubstitution {
  allowedBoolean?: boolean;
  allowedCodeableConcept?: FhirCodeableConcept;
  reason?: FhirCodeableConcept;
}

// ServiceRequest Resource (Orden de laboratorio/gabinete)
export interface FhirServiceRequest extends FhirResource {
  resourceType: "ServiceRequest";
  identifier?: FhirIdentifier[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: FhirReference[];
  replaces?: FhirReference[];
  requisition?: FhirIdentifier;
  status: "draft" | "active" | "on-hold" | "revoked" | "completed" | "entered-in-error" | "unknown";
  intent: "proposal" | "plan" | "directive" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
  category?: FhirCodeableConcept[];
  priority?: "routine" | "urgent" | "asap" | "stat";
  doNotPerform?: boolean;
  code?: FhirCodeableConcept;
  orderDetail?: FhirCodeableConcept[];
  quantityQuantity?: FhirQuantity;
  quantityRatio?: FhirRatio;
  quantityRange?: FhirRange;
  subject: FhirReference;
  encounter?: FhirReference;
  occurrenceDateTime?: string;
  occurrencePeriod?: FhirPeriod;
  occurrenceTiming?: FhirTiming;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: FhirCodeableConcept;
  authoredOn?: string;
  requester?: FhirReference;
  performerType?: FhirCodeableConcept;
  performer?: FhirReference[];
  locationCode?: FhirCodeableConcept[];
  locationReference?: FhirReference[];
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  insurance?: FhirReference[];
  supportingInfo?: FhirReference[];
  specimen?: FhirReference[];
  bodySite?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
  patientInstruction?: string;
  relevantHistory?: FhirReference[];
}

// Consent Resource (Consentimiento)
export interface FhirConsent extends FhirResource {
  resourceType: "Consent";
  identifier?: FhirIdentifier[];
  status: "draft" | "proposed" | "active" | "rejected" | "inactive" | "entered-in-error";
  scope: FhirCodeableConcept;
  category: FhirCodeableConcept[];
  patient?: FhirReference;
  dateTime?: string;
  performer?: FhirReference[];
  organization?: FhirReference[];
  sourceAttachment?: FhirAttachment;
  sourceReference?: FhirReference;
  policy?: FhirConsentPolicy[];
  policyRule?: FhirCodeableConcept;
  verification?: FhirConsentVerification[];
  provision?: FhirConsentProvision;
}

export interface FhirAttachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

export interface FhirConsentPolicy {
  authority?: string;
  uri?: string;
}

export interface FhirConsentVerification {
  verified: boolean;
  verifiedWith?: FhirReference;
  verificationDate?: string;
}

export interface FhirConsentProvision {
  type?: "deny" | "permit";
  period?: FhirPeriod;
  actor?: FhirConsentProvisionActor[];
  action?: FhirCodeableConcept[];
  securityLabel?: FhirCoding[];
  purpose?: FhirCoding[];
  class?: FhirCoding[];
  code?: FhirCodeableConcept[];
  dataPeriod?: FhirPeriod;
  data?: FhirConsentProvisionData[];
  provision?: FhirConsentProvision[];
}

export interface FhirConsentProvisionActor {
  role: FhirCodeableConcept;
  reference: FhirReference;
}

export interface FhirConsentProvisionData {
  meaning: "instance" | "related" | "dependents" | "authoredby";
  reference: FhirReference;
}

// AuditEvent Resource (Evento de auditoría)
export interface FhirAuditEvent extends FhirResource {
  resourceType: "AuditEvent";
  type: FhirCoding;
  subtype?: FhirCoding[];
  action?: "C" | "R" | "U" | "D" | "E";
  period?: FhirPeriod;
  recorded: string;
  outcome?: "0" | "4" | "8" | "12";
  outcomeDesc?: string;
  purposeOfEvent?: FhirCodeableConcept[];
  agent: FhirAuditEventAgent[];
  source: FhirAuditEventSource;
  entity?: FhirAuditEventEntity[];
}

export interface FhirAuditEventAgent {
  type?: FhirCodeableConcept;
  role?: FhirCodeableConcept[];
  who?: FhirReference;
  altId?: string;
  name?: string;
  requestor: boolean;
  location?: FhirReference;
  policy?: string[];
  media?: FhirCoding;
  network?: FhirAuditEventAgentNetwork;
  purposeOfUse?: FhirCodeableConcept[];
}

export interface FhirAuditEventAgentNetwork {
  address?: string;
  type?: "1" | "2" | "3" | "4" | "5";
}

export interface FhirAuditEventSource {
  site?: string;
  observer: FhirReference;
  type?: FhirCoding[];
}

export interface FhirAuditEventEntity {
  what?: FhirReference;
  type?: FhirCoding;
  role?: FhirCoding;
  lifecycle?: FhirCoding;
  securityLabel?: FhirCoding[];
  name?: string;
  description?: string;
  query?: string;
  detail?: FhirAuditEventEntityDetail[];
}

export interface FhirAuditEventEntityDetail {
  type: string;
  valueString?: string;
  valueBase64Binary?: string;
}

// Bundle Resource (Colección de recursos)
export interface FhirBundle extends FhirResource {
  resourceType: "Bundle";
  identifier?: FhirIdentifier;
  type: "document" | "message" | "transaction" | "transaction-response" | "batch" | "batch-response" | "history" | "searchset" | "collection";
  timestamp?: string;
  total?: number;
  link?: FhirBundleLink[];
  entry?: FhirBundleEntry[];
  signature?: FhirSignature;
}

export interface FhirBundleLink {
  relation: string;
  url: string;
}

export interface FhirBundleEntry {
  link?: FhirBundleLink[];
  fullUrl?: string;
  resource?: FhirResource;
  search?: FhirBundleEntrySearch;
  request?: FhirBundleEntryRequest;
  response?: FhirBundleEntryResponse;
}

export interface FhirBundleEntrySearch {
  mode?: "match" | "include" | "outcome";
  score?: number;
}

export interface FhirBundleEntryRequest {
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifMatch?: string;
  ifNoneExist?: string;
}

export interface FhirBundleEntryResponse {
  status: string;
  location?: string;
  etag?: string;
  lastModified?: string;
  outcome?: FhirResource;
}

export interface FhirSignature {
  type: FhirCoding[];
  when: string;
  who: FhirReference;
  onBehalfOf?: FhirReference;
  targetFormat?: string;
  sigFormat?: string;
  data?: string;
}

// CapabilityStatement Resource
export interface FhirCapabilityStatement extends FhirResource {
  resourceType: "CapabilityStatement";
  url?: string;
  version?: string;
  name?: string;
  title?: string;
  status: "draft" | "active" | "retired" | "unknown";
  experimental?: boolean;
  date: string;
  publisher?: string;
  contact?: FhirContactDetail[];
  description?: string;
  useContext?: FhirUsageContext[];
  jurisdiction?: FhirCodeableConcept[];
  purpose?: string;
  copyright?: string;
  kind: "instance" | "capability" | "requirements";
  instantiates?: string[];
  imports?: string[];
  software?: FhirCapabilityStatementSoftware;
  implementation?: FhirCapabilityStatementImplementation;
  fhirVersion: string;
  format: string[];
  patchFormat?: string[];
  implementationGuide?: string[];
  rest?: FhirCapabilityStatementRest[];
}

export interface FhirContactDetail {
  name?: string;
  telecom?: FhirContactPoint[];
}

export interface FhirUsageContext {
  code: FhirCoding;
  valueCodeableConcept?: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueRange?: FhirRange;
  valueReference?: FhirReference;
}

export interface FhirCapabilityStatementSoftware {
  name: string;
  version?: string;
  releaseDate?: string;
}

export interface FhirCapabilityStatementImplementation {
  description: string;
  url?: string;
  custodian?: FhirReference;
}

export interface FhirCapabilityStatementRest {
  mode: "client" | "server";
  documentation?: string;
  security?: FhirCapabilityStatementRestSecurity;
  resource?: FhirCapabilityStatementRestResource[];
  interaction?: FhirCapabilityStatementRestInteraction[];
  searchParam?: FhirCapabilityStatementRestResourceSearchParam[];
  operation?: FhirCapabilityStatementRestResourceOperation[];
  compartment?: string[];
}

export interface FhirCapabilityStatementRestSecurity {
  cors?: boolean;
  service?: FhirCodeableConcept[];
  description?: string;
}

export interface FhirCapabilityStatementRestResource {
  type: string;
  profile?: string;
  supportedProfile?: string[];
  documentation?: string;
  interaction?: FhirCapabilityStatementRestResourceInteraction[];
  versioning?: "no-version" | "versioned" | "versioned-update";
  readHistory?: boolean;
  updateCreate?: boolean;
  conditionalCreate?: boolean;
  conditionalRead?: "not-supported" | "modified-since" | "not-match" | "full-support";
  conditionalUpdate?: boolean;
  conditionalDelete?: "not-supported" | "single" | "multiple";
  referencePolicy?: ("literal" | "logical" | "resolves" | "enforced" | "local")[];
  searchInclude?: string[];
  searchRevInclude?: string[];
  searchParam?: FhirCapabilityStatementRestResourceSearchParam[];
  operation?: FhirCapabilityStatementRestResourceOperation[];
}

export interface FhirCapabilityStatementRestResourceInteraction {
  code: "read" | "vread" | "update" | "patch" | "delete" | "history-instance" | "history-type" | "create" | "search-type";
  documentation?: string;
}

export interface FhirCapabilityStatementRestInteraction {
  code: "transaction" | "batch" | "search-system" | "history-system";
  documentation?: string;
}

export interface FhirCapabilityStatementRestResourceSearchParam {
  name: string;
  definition?: string;
  type: "number" | "date" | "string" | "token" | "reference" | "composite" | "quantity" | "uri" | "special";
  documentation?: string;
}

export interface FhirCapabilityStatementRestResourceOperation {
  name: string;
  definition: string;
  documentation?: string;
}

// OperationOutcome Resource (Errores)
export interface FhirOperationOutcome extends FhirResource {
  resourceType: "OperationOutcome";
  issue: FhirOperationOutcomeIssue[];
}

export interface FhirOperationOutcomeIssue {
  severity: "fatal" | "error" | "warning" | "information";
  code: string;
  details?: FhirCodeableConcept;
  diagnostics?: string;
  location?: string[];
  expression?: string[];
}
