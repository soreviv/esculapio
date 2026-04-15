# Specialized Workflows

## New Endpoint Audit Checklist

When adding or modifying any API route in `server/routes.ts`:

1. Locate the route and identify what data it handles
2. Check if it touches sensitive data (PII, clinical records, prescriptions)
3. Confirm `storage.createAuditLog(...)` is called inside the `try/catch` block
4. Verify the response does not expose encrypted field values directly
5. Ensure rate limiting applies (1000 req/15min general, 10 req/15min auth endpoints)
6. Confirm Zod schema validation is applied to all inputs

## Medical Note Validation Checklist

When modifying the medical notes flow:

1. Review `shared/schema.ts` to confirm the note type is supported
2. Verify all required NOM-004 fields are present in the schema
3. Confirm the signing flow generates SHA-256 hash from canonical content
4. Ensure diagnoses use CIE-10 codes stored relationally (not free text only)
5. Verify that signed notes (`firmada: true`) cannot be updated via any route
6. Confirm addendum flow creates a new linked note, never overwrites

## FHIR Endpoint Development Checklist

When adding or modifying `/fhir` routes:

1. Identify which FHIR resource type applies (see fhir-mapping.md)
2. Use `shared/fhir-mappers.ts` — never build FHIR responses inline in routes
3. Validate Bundle structure: `resourceType`, `type`, `total`, `entry`
4. Audit log the FHIR access (READ operations on patient data must be logged)
5. Confirm authentication and role-based access before returning any data

## Schema Change Checklist

When modifying `shared/schema.ts`:

1. Check if new fields contain PII — if so, mark `// SENSITIVE` and apply encryption
2. Run `npm run db:push` to apply migrations
3. Update corresponding FHIR mapper in `shared/fhir-mappers.ts` if the table maps to a FHIR resource
4. Update Zod validation schemas to include/exclude the new fields as appropriate
5. Verify TypeScript types are regenerated and `npm run check` passes

## Clinical Documentation Patterns (from Anthropic Healthcare Solutions)

Claude can assist with:
- **Ambient scribing**: Generating clinical notes from visit recordings with items flagged for physician review
- **ICD-10 coding**: Use `mcp__claude_ai_ICD-10_Codes__search_codes` to find and validate diagnosis codes
- **Prior authorization**: Cross-referencing records against coverage requirements
- **Patient triage**: Routing and prioritizing clinical messages
