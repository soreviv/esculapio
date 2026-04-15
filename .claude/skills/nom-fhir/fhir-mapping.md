# HL7 FHIR R4 — Resource Mapping

## Resource → Table Mapping

| FHIR R4 Resource | Esculapio Table | Notes |
|------------------|-----------------|-------|
| `Patient` | `patients` | Includes demographics, CURP, contact info |
| `Encounter` | `medical_notes` | Clinical visit records |
| `Observation` | `vitals` | Vital signs measurements |
| `MedicationRequest` | `prescriptions` | Prescriptions with controlled substance handling |
| `DiagnosticReport` | `lab_orders` | Lab orders and results |
| `Consent` | `patient_consents` | Informed consent records |
| `AuditEvent` | `audit_logs` | NOM-024 audit trail |

## FHIR Endpoint Rules

- All responses under `/fhir` must be valid FHIR Bundles or Resources
- Use `shared/fhir-mappers.ts` to transform internal data to FHIR format
- Never return raw DB rows from `/fhir` routes — always transform through mappers
- Bundles must include `resourceType`, `type`, `total`, and `entry` fields

## Key FHIR Identifiers

- Patient identifier system: `urn:oid:2.16.840.1.113883.2.24.4` (CURP)
- Encounter class: `AMB` (ambulatory) for outpatient visits
- Observation status: `final` for signed vitals, `preliminary` for unsigned

## Integration Standards Supported

- FHIR R4 (primary)
- HL7 v2 workflows (via adapter layer)
- Apple HealthKit / Android Health Connect (future)
- CMS Coverage Database (for insurance validation)
- NPI Registry (provider credential validation)
