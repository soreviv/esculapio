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
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit manages database migrations in `/migrations` directory
- **Key Tables**: users, patients, medical_notes, vitals, prescriptions, appointments

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