# MediRecord - Electronic Health Record System

## Overview

MediRecord is a web-based Electronic Health Record (EHR) system designed for healthcare establishments in Mexico, built to comply with NOM-024-SSA3-2012 standards. The application manages patient records, medical notes, vital signs, prescriptions, and appointments for medical professionals including doctors, nurses, and administrators.

The system is a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence. It prioritizes information clarity, data entry efficiency, and patient safety as core design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON API endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL session storage

### Data Storage
- **Database**: PostgreSQL with optimized connection pooling
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit manages database migrations in `/migrations` directory
- **Key Tables**: users, patients, medical_notes, vitals, prescriptions, appointments
- **Connection Pooling**: Configured in `server/db.ts` with max 20 connections, min 2 idle, 30s idle timeout

### Database Optimization
- **Indexes**: Foreign key and frequently queried columns indexed (see `migrations/0002_add_indexes.sql`)
  - Medical notes: patient_id, medico_id, fecha, tipo
  - Vitals: patient_id, fecha, registrado_por_id
  - Prescriptions: patient_id, medico_id, status
  - Appointments: patient_id, medico_id, fecha, status, composite (fecha, medico_id)
  - Audit logs: user_id, entidad, fecha, entidad_id
  - Patient search: nombre, apellido_paterno, status
- **Connection Pool Settings**: Configurable via DB_POOL_MAX and DB_POOL_MIN environment variables

### API Documentation
- **OpenAPI 3.0**: Full API specification at `/api-docs.json`
- **Swagger UI**: Interactive documentation at `/api-docs`
- **Auto-generation**: JSDoc annotations in `server/routes.ts`
- **Config**: `server/swagger.ts` contains schema definitions and metadata

### Project Structure
```
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/  # UI components (ehr/ for domain-specific, ui/ for shadcn)
│   │   ├── pages/       # Route page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema and Zod validation
```

### Key Design Patterns
- **Storage Interface Pattern**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **Schema-First Approach**: Drizzle schema with drizzle-zod for automatic validation schema generation
- **Component-Based UI**: Domain-specific EHR components (PatientCard, MedicalNoteCard, VitalsDisplay) encapsulate healthcare-specific UI logic
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory

### Authentication System
- **Password Hashing**: bcrypt with SALT_ROUNDS=12
- **Password Policy**: zxcvbn for strength validation (minimum score 3/4 required)
- **Session Storage**: express-session with connect-pg-simple (PostgreSQL-backed sessions)
- **Session Configuration**: 24-hour max age, httpOnly cookies, sameSite=lax, secure in production
- **Auth Middleware**: isAuthenticated (all users), isMedico (doctors/admin), isAdmin (admin only) in `server/auth.ts`
- **Audit Logging**: All protected routes use req.session.userId for NOM-024-SSA3-2012 audit trail compliance
- **Default Admin**: Created via `scripts/seed-admin.ts` using ADMIN_PASSWORD environment variable

### Security Middleware
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate Limiting**: 
  - General API: 1000 requests/15min
  - Auth endpoints: 10 requests/15min (login/register)
- **Password Validation**: zxcvbn library for password strength analysis
  - Rejects common passwords and dictionary words
  - Prevents use of username/name in password
  - Returns feedback and crack time estimates

### Structured Logging
- **Library**: Pino with pino-http for request logging
- **Levels**: debug (development), info (production)
- **Features**:
  - Automatic PHI redaction in production
  - Request/response timing
  - Pretty printing in development
  - JSON format in production (ELK-compatible)

### Role-Based Access Control (RBAC)
- **Roles**: admin, medico, enfermeria
- **Middleware**: `isAuthenticated`, `isAdmin`, `isMedico`, `isMedicoOrEnfermeria`
- **Route Protection**:
  - Patient CRUD: requires `isMedicoOrEnfermeria`
  - Medical Notes: read requires `isAuthenticated`, create/update requires `isMedico`
  - Vitals: requires `isMedicoOrEnfermeria`
  - Prescriptions: read requires `isAuthenticated`, create/update requires `isMedico`
  - Lab Orders: read requires `isAuthenticated`, create/update requires `isMedico`
  - Audit Logs: requires `isAdmin`
  - User Registration: requires `isAdmin`

### Production Logging Security
- Sensitive PHI paths (/api/patients, /api/notes, /api/vitals, etc.) only log record counts in production
- Non-sensitive paths redact sensitive fields (password, curp, telefono, diagnostico, etc.)
- Full JSON logging only in development mode

### Scripts
- `scripts/seed-admin.ts`: Creates admin user with bcrypt-hashed password (requires ADMIN_PASSWORD env var)
- `scripts/migrate-passwords.ts`: Migrates plaintext passwords to bcrypt hashes (skips already-hashed passwords)

### Testing
- **Framework**: Vitest with @vitest/coverage-v8
- **Test Files**: `tests/` directory
- **Coverage Areas**:
  - Authentication (password hashing, RBAC middleware)
  - NOM-024-SSA3-2012 compliance (signed notes immutability, audit trail)
  - NOM-004-SSA3-2012 compliance (clinical record requirements, note types, consent fields)
  - LFPDPPP compliance (patient consent tracking)
  - COFEPRIS requirements (prescription and lab order fields)
- **Run Tests**: `npx vitest run`
- **Coverage**: `npx vitest run --coverage`

## Regulatory Compliance

### NOM-004-SSA3-2012 (Del Expediente Clínico)
- **Patient Data**: numeroExpediente, antecedentes heredofamiliares/patológicos/no patológicos, ocupación, estado civil
- **Medical Note Types**: historia_clinica, nota_inicial, nota_evolucion, nota_interconsulta, nota_referencia, nota_ingreso, nota_preoperatoria, nota_postoperatoria, nota_preanestesica, nota_egreso
- **Clinical Fields**: hora, padecimiento actual, habitus exterior, exploración física, pronóstico, indicación terapéutica
- **Surgical Notes**: diagnóstico pre/post operatorio, operación realizada, descripción técnica, hallazgos, complicaciones, sangrado
- **Discharge Notes**: fechas ingreso/egreso, motivo egreso, diagnóstico final, resumen evolución, recomendaciones
- **Informed Consent**: procedimiento, riesgos, beneficios, alternativas, firmante, testigos, lugar
- **Nursing Notes**: turno, habitus exterior, medicamentos ministrados, procedimientos realizados
- **Establishment Config**: tipo, nombre, domicilio, licencia sanitaria, responsable sanitario

### NOM-024-SSA3-2012 (SIRES - Electronic Records)
- **Electronic Signatures**: SHA-256 hash for signed notes, timestamp, signing user
- **Immutability**: Signed notes (firmada=true) cannot be modified
- **Audit Trail**: All actions logged with userId, action, entity, timestamp, IP address, user agent
- **Standardized Codes**: CIE-10 catalog for diagnoses

### LFPDPPP (Data Protection)
- **Consent Types**: privacidad, expediente_electronico, tratamiento_datos, comunicaciones
- **Consent Records**: versión, fecha de aceptación, IP address

### COFEPRIS Requirements
- **Prescriptions**: medicamento, dosis, vía, frecuencia, duración, indicaciones
- **Lab Orders**: estudios, diagnóstico presuntivo, indicaciones clínicas, urgente, ayuno

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### UI Framework
- **Radix UI**: Accessible, unstyled component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled components using Radix primitives
- **Lucide React**: Icon library

### Data Fetching
- **TanStack Query**: Server state management with caching, configured in `client/src/lib/queryClient.ts`

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation (integrated with Drizzle via drizzle-zod)
- **@hookform/resolvers**: Zod resolver for React Hook Form

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **TypeScript**: Full-stack type safety

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Intelligent class merging via `cn()` utility

### Data Visualization
- **Recharts**: React charting library for dashboard analytics (bar charts, pie charts)

## Sprint 1 Features (Implemented December 2025)

### Dashboard Analytics
- **Endpoint**: `GET /api/dashboard/metrics`
- **Data**: Aggregated statistics including:
  - Total and active patients count
  - Daily appointments for the last 7 days
  - Appointments by status distribution
  - Medical notes created today
  - Active prescriptions count
- **UI Components**: Bar chart (appointments by day), Pie chart (appointment status distribution)

### Patient Timeline
- **Endpoint**: `GET /api/patients/:id/timeline`
- **Data**: Chronological aggregation of all patient events:
  - Medical notes (all types)
  - Vital signs recordings
  - Prescriptions
  - Appointments
  - Laboratory orders
- **Features**: Color-coded timeline with icons, sorted newest first
- **Compliance**: Timeline access logged for NOM-024-SSA3-2012 audit trail

### Advanced Patient Search
- **Component**: `AdvancedPatientSearch.tsx` with Sheet-based UI
- **Filters**:
  - Date range (desde/hasta)
  - Diagnosis (CIE-10 code)
  - Treating doctor (medicoId)
  - Patient status