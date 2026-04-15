---
name: nom-fhir
description: Medical compliance and interoperability for NOM-004/NOM-024 and HL7 FHIR R4. Use when working on healthcare features, patient data APIs, electronic signatures, audit logging, ICD-10 coding, or clinical record schemas in the Esculapio EHR system.
when_to_use: Activate when implementing endpoints that handle patient data or medical notes, interoperability logic (FHIR), electronic signature or audit processes, or database schema changes related to the clinical record.
---

# NOM + FHIR — Medical Compliance & Interoperability

This skill specializes Claude Code for development and auditing of Esculapio, with focus on Mexican regulations and the HL7 FHIR R4 standard.

## Quick Rules

- Every sensitive data operation (CREATE, READ, UPDATE, DELETE) **must** be recorded in `audit_logs` via `storage.createAuditLog` with IP and UserAgent.
- A medical note with `firmada: true` can **never** be edited — only addenda are allowed.
- Sensitive fields (`curp`, `telefono`, `telefonoEmergencia`) **must** pass through `encrypt()` from `server/crypto.ts` before any DB write.
- All responses under `/fhir` must be valid FHIR Bundles or Resources using `shared/fhir-mappers.ts`.

## Required Fields — Medical Notes

`motivoConsulta`, `padecimientoActual`, `signosVitales`, `exploracionFisica`, `diagnostico` (CIE-10), `pronostico`

## Reference Files

- [regulatory-mandates.md](regulatory-mandates.md) — Full NOM-004/NOM-024 compliance rules
- [fhir-mapping.md](fhir-mapping.md) — HL7 FHIR R4 resource mapping to DB tables
- [workflows.md](workflows.md) — Step-by-step audit and validation workflows
