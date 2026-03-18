# Skill: Medical Compliance & Interoperability (NOM + FHIR)

This skill specializes Claude Code for development and auditing of health systems, with specific focus on Mexican regulations and the HL7 FHIR R4 standard.

## Activation Context

Activate this skill when working on:
- API endpoints that handle patient data or medical notes
- Interoperability logic (FHIR)
- Electronic signature or audit processes
- Database schema changes related to the clinical record

## Regulatory Mandates (NOM-004 / NOM-024)

- **Full Traceability:** Before closing any backend task, verify that every action (CREATE, READ, UPDATE, DELETE) on sensitive data is recorded in `audit_logs` with IP and UserAgent via `storage.createAuditLog`.
- **Signature Immutability:** If the medical notes flow is modified, ensure a note with `firmada: true` can NEVER be edited. The only valid path is an `addendum`.
- **Required Fields:** When creating interfaces or schemas for medical notes, ensure presence of: Motivo de consulta, Padecimiento actual, Signos vitales, Exploración física, Diagnóstico (CIE-10), and Pronóstico.

## HL7 FHIR R4 Standard

- **Resource Mapping:**
  - `Patient` → table `patients`
  - `Encounter` → table `medical_notes`
  - `Observation` → table `vitals`
  - `MedicationRequest` → table `prescriptions`
- **Validation:** All responses under path `/fhir` must be valid Bundles or Resources. Use `shared/fhir-mappers.ts` to transform internal data to FHIR.

## Security & Privacy

- **Encryption at Rest:** Sensitive fields in `shared/schema.ts` (marked `// SENSITIVE`: `curp`, `telefono`, `telefonoEmergencia`) must pass through `encrypt()` from `server/crypto.ts` before any `db.insert` or `db.update`.
- **Log Redaction:** Verify the logging middleware in `server/index.ts` keeps sensitive field redaction active to prevent leaks in server logs.

## Specialized Workflows

### New Endpoint Audit
1. Locate the route in `server/routes.ts`.
2. Check if it handles sensitive data (PII).
3. Confirm a `storage.createAuditLog` call exists inside the `try/catch` block.
4. Validate that the response does not expose encrypted values directly (decrypt only for the authorized client).

### Medical Note Validation
1. Review `shared/schema.ts` to confirm the note type is supported.
2. Confirm the signing flow generates the SHA-256 hash from canonical content.
3. Ensure diagnoses are looked up in the CIE-10 catalog and stored relationally.
