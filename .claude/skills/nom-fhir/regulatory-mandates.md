# Regulatory Mandates — NOM-004 / NOM-024

## NOM-024-SSA3-2012 (Electronic Recording Systems)

### Full Traceability
Every action on sensitive data must be recorded in `audit_logs`:
- Fields required: `userId`, `action` (CREATE/READ/UPDATE/DELETE), `resourceType`, `resourceId`, `ipAddress`, `userAgent`, `timestamp`
- Call: `storage.createAuditLog(...)` inside the `try/catch` block of every route handler
- Never skip audit logging — it is a legal requirement, not optional

### Electronic Signatures
- Signing flow must generate a SHA-256 hash from canonical note content
- Hash stored in `firmaHash` field
- Once signed (`firmada: true`), the note is **immutable**
- Any correction must be made via addendum — a new note linked to the original

### Session & Access Control
- Session-based auth via express-session (PostgreSQL session store in production)
- Role-based access: `medico`, `enfermeria`, `admin`
- Middleware: `isAuthenticated()`, `isAdmin()`, `isMedico()`, `isMedicoOrEnfermeria()`

## NOM-004-SSA3-2012 (Clinical Record Content)

### Required Fields in Medical Notes
All medical note schemas must include:
| Field | Description |
|-------|-------------|
| `motivoConsulta` | Chief complaint |
| `padecimientoActual` | Present illness history |
| `signosVitales` | Vital signs (linked to `vitals` table) |
| `exploracionFisica` | Physical examination |
| `diagnostico` | Diagnosis with CIE-10 code |
| `pronostico` | Prognosis |

### ICD-10 / CIE-10 Coding
- Diagnoses must be looked up in the CIE-10 catalog
- Stored relationally — never as free text only
- Use the MCP ICD-10 tool (`mcp__claude_ai_ICD-10_Codes__search_codes`) to validate codes during development

## Security & Privacy

### Encryption at Rest
Sensitive fields in `shared/schema.ts` marked `// SENSITIVE`:
- `curp`
- `telefono`
- `telefonoEmergencia`

These **must** pass through `encrypt()` from `server/crypto.ts` before any `db.insert` or `db.update`.
Decrypt only when returning data to the authorized client.

### Log Redaction
The logging middleware in `server/index.ts` must keep sensitive field redaction active at all times.
Never disable redaction, even in development.
