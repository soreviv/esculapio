# CLAUDE.md - Project Guide for Salud Digital (MediRecord)

## Project Overview

Full-stack Electronic Health Record (EHR) system compliant with Mexican healthcare regulations (NOM-024-SSA3-2012, NOM-004-SSA3-2012) and HIPAA. TypeScript monorepo with React frontend and Express backend.

## Quick Commands

```bash
npm run dev       # Start dev server (backend + Vite HMR frontend)
npm run build     # Production build (Vite frontend + esbuild backend)
npm run start     # Start production server
npm run check     # TypeScript type checking (tsc --noEmit)
npm run db:push   # Apply database migrations (drizzle-kit push)
npx vitest run    # Run tests
```

## Project Structure

```
client/src/          # React 18 frontend (Vite)
  components/        # Reusable components
    ui/              # shadcn/ui base components (60+)
    ehr/             # Healthcare-specific components
  pages/             # Route pages (Dashboard, Pacientes, Citas, etc.)
  hooks/             # Custom React hooks
  lib/               # Utilities (queryClient, utils)
server/              # Express backend
  index.ts           # App setup, middleware, server start
  routes.ts          # All API endpoint definitions
  storage.ts         # Data access layer (repository pattern)
  auth.ts            # Authentication & RBAC middleware
  db.ts              # Database connection
shared/              # Shared between client and server
  schema.ts          # Drizzle ORM schemas + Zod validation
tests/               # Test files (Vitest)
migrations/          # Drizzle database migrations
script/build.ts      # Custom esbuild + Vite build script
```

## Tech Stack

- **Frontend**: React 18, Vite 5, TanStack Query, Tailwind CSS 3, shadcn/ui, Wouter (routing), React Hook Form, Recharts
- **Backend**: Express 4, Drizzle ORM, PostgreSQL, Passport.js (session-based auth), Pino (logging)
- **Build**: esbuild (server bundle), Vite (client bundle), TypeScript 5.6
- **Testing**: Vitest 4, @testing-library/react, Supertest

## Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Naming Conventions

- **Spanish** for user-facing features and domain terms (pacientes, expedientes, citas, notas medicas)
- **English** for code identifiers (variable names, function names)
- **camelCase** for TypeScript variables/functions
- **PascalCase** for React components and TypeScript types
- **snake_case** for SQL column names

## Architecture Patterns

- **Monorepo**: Single `package.json`, shared types via `shared/schema.ts`
- **Repository pattern**: All DB access through `storage.ts` methods
- **Zod + Drizzle**: Schema defined once in `shared/schema.ts`, generates both DB types and runtime validation
- **TanStack Query**: All server state management via query/mutation hooks
- **shadcn/ui components**: Radix UI primitives styled with Tailwind. New UI components go in `client/src/components/ui/`

## Authentication & Authorization

- Session-based auth with express-session (PostgreSQL session store in production)
- Roles: `medico` (doctor), `enfermeria` (nurse), `admin`
- Middleware: `isAuthenticated()`, `isAdmin()`, `isMedico()`, `isMedicoOrEnfermeria()`
- Passwords: bcrypt with 12 salt rounds, zxcvbn strength validation (minimum score 3)

## API Conventions

- All endpoints under `/api/`
- JSON request/response bodies
- Zod validation on all inputs
- Audit logging on critical actions (NOM-024 compliance)
- Rate limiting: 1000 req/15min general, 10 req/15min auth endpoints
- API docs at `/api-docs` (Swagger)

## Database

- PostgreSQL with Drizzle ORM
- UUIDs for all primary keys (`gen_random_uuid()`)
- Schema in `shared/schema.ts`, migrations in `migrations/`
- Key tables: users, patients, medical_notes, vitals, prescriptions, appointments, lab_orders, patient_consents, audit_logs

## Testing

- Vitest with node environment and global test utilities
- Coverage thresholds: 80% lines/functions/statements, 70% branches
- Test files in `tests/` directory
- Use `npx vitest run` to execute tests

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Session encryption key (required in production)
- `NODE_ENV` — "production" or "development"
- `PORT` — Server port (default: 5000)
- `LOG_LEVEL` — Pino log level

## Important Notes

- This is a healthcare application — never bypass audit logging or authentication checks
- All patient data operations must maintain NOM-004/NOM-024 compliance
- Electronic signatures on medical notes use hash-based verification (firmaHash fields)
- Sensitive fields are automatically redacted in production logs

---

## Skill: Medical Compliance & Interoperability (NOM + FHIR)

This skill specializes Claude Code for development and auditing of health systems, with specific focus on Mexican regulations and the HL7 FHIR R4 standard.

### Activation Context

Activate this skill when working on:
- API endpoints that handle patient data or medical notes
- Interoperability logic (FHIR)
- Electronic signature or audit processes
- Database schema changes related to the clinical record

### Regulatory Mandates (NOM-004 / NOM-024)

- **Full Traceability:** Before closing any backend task, verify that every action (CREATE, READ, UPDATE, DELETE) on sensitive data is recorded in `audit_logs` with IP and UserAgent via `storage.createAuditLog`.
- **Signature Immutability:** If the medical notes flow is modified, ensure a note with `firmada: true` can NEVER be edited. The only valid path is an `addendum`.
- **Required Fields:** When creating interfaces or schemas for medical notes, ensure presence of: Motivo de consulta, Padecimiento actual, Signos vitales, Exploración física, Diagnóstico (CIE-10), and Pronóstico.

### HL7 FHIR R4 Standard

- **Resource Mapping:**
  - `Patient` → table `patients`
  - `Encounter` → table `medical_notes`
  - `Observation` → table `vitals`
  - `MedicationRequest` → table `prescriptions`
- **Validation:** All responses under path `/fhir` must be valid Bundles or Resources. Use `shared/fhir-mappers.ts` to transform internal data to FHIR.

### Security & Privacy

- **Encryption at Rest:** Sensitive fields in `shared/schema.ts` (marked `// SENSITIVE`: `curp`, `telefono`, `telefonoEmergencia`) must pass through `encrypt()` from `server/crypto.ts` before any `db.insert` or `db.update`.
- **Log Redaction:** Verify the logging middleware in `server/index.ts` keeps sensitive field redaction active to prevent leaks in server logs.

### Specialized Workflows

#### New Endpoint Audit
1. Locate the route in `server/routes.ts`.
2. Check if it handles sensitive data (PII).
3. Confirm a `storage.createAuditLog` call exists inside the `try/catch` block.
4. Validate that the response does not expose encrypted values directly (decrypt only for the authorized client).

#### Medical Note Validation
1. Review `shared/schema.ts` to confirm the note type is supported.
2. Confirm the signing flow generates the SHA-256 hash from canonical content.
3. Ensure diagnoses are looked up in the CIE-10 catalog and stored relationally.
