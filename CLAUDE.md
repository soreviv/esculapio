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

## Custom Skills

- **`/nom-fhir`** — Medical Compliance & Interoperability (NOM-004/NOM-024 + HL7 FHIR R4). See `.claude/commands/nom-fhir.md`.
