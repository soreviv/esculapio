# Design Guidelines: Sistema de Registro Electrónico de Salud (EHR) - NOM-024 Compliant

## Design Approach

**System-Based Approach**: This is a mission-critical healthcare application where clarity, efficiency, and data accuracy are paramount. Drawing from **Fluent Design** and **Material Design** principles optimized for enterprise medical applications, with inspiration from established EHR systems like Epic and Cerner for proven medical UI patterns.

**Core Principle**: Medical professionals need instant access to critical information with zero ambiguity. Every design decision prioritizes information hierarchy, data entry efficiency, and patient safety.

---

## Typography

**Font Family**: 
- Primary: Inter or Roboto (excellent readability for medical data)
- Monospace: JetBrains Mono for patient IDs, medical record numbers

**Type Scale**:
- Page Titles (H1): text-2xl font-semibold
- Section Headers (H2): text-xl font-semibold  
- Card/Module Titles (H3): text-lg font-medium
- Body Text: text-base font-normal
- Labels: text-sm font-medium uppercase tracking-wide
- Medical Data/Results: text-base font-medium (emphasize clinical values)
- Timestamps/Metadata: text-xs text-gray-500

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 3, 4, 6, 8** for consistent rhythm
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Page margins: p-6 to p-8
- Form field spacing: space-y-4

**Grid Structure**:
- Main container: max-w-7xl mx-auto
- Two-column layouts: grid grid-cols-1 lg:grid-cols-3 (sidebar + main content)
- Form layouts: grid grid-cols-1 md:grid-cols-2 gap-4
- Data tables: Full-width within container

**Application Shell**:
- Fixed top navigation bar (h-16)
- Collapsible left sidebar (w-64) for main navigation
- Main content area with breadcrumbs
- Right panel for contextual actions/info (when needed)

---

## Component Library

### Navigation
- **Top Bar**: Logo, patient search, notifications, user profile
- **Sidebar**: Role-based menu items with icons, expandable sections for modules (Pacientes, Expedientes, Laboratorio, etc.)
- **Breadcrumbs**: Always visible for context (Home > Pacientes > Juan Pérez > Expediente)

### Forms & Data Entry
- **Input Fields**: Full-width with clear labels above, helper text below
- **Required Field Indicator**: Red asterisk (*) next to label
- **Date/Time Pickers**: Calendar overlays with quick access to today/now
- **Dropdowns**: Searchable selects for medical catalogs (CIE-10, medications)
- **Multi-step Forms**: Progress indicator at top, clear next/previous navigation
- **Validation**: Inline error messages in red, success states in green

### Data Display
- **Patient Cards**: Avatar/initials, name, age, ID, quick actions
- **Medical Records Table**: Sortable columns, row hover states, quick view icons
- **Vitals Display**: Large numbers with units, trend indicators (↑↓), time-series graphs
- **Lab Results**: Tabular format with reference ranges, flag abnormal values
- **Timeline View**: Chronological medical events with date stamps and icons

### Actions & Feedback
- **Primary Buttons**: Solid with medium weight (px-6 py-2.5)
- **Secondary Buttons**: Outlined style
- **Icon Buttons**: For quick actions in tables/cards
- **Status Badges**: Rounded pills for patient status (Activo, Alta, En consulta)
- **Toast Notifications**: Top-right corner for system feedback
- **Confirmation Modals**: For critical actions (delete, sign document)

### Medical-Specific Components
- **Signature Panel**: Digital signature capture with timestamp and user info
- **Document Viewer**: PDF-style display for clinical notes with version history
- **Prescription Builder**: Drug search, dosage fields, duration, instructions
- **Diagnosis Selector**: CIE-10 search with autocomplete
- **Allergy Alerts**: Prominent warning banner when present

---

## Page Layouts

### Dashboard (Médicos)
- Welcome header with user name and role
- 4-column grid showing: Citas Hoy, Pacientes Activos, Pendientes, Alertas
- Recent patient list with quick access
- Calendar widget for upcoming appointments

### Patient Registry (Registro de Pacientes)
- Search bar with filters (name, ID, DOB)
- New patient button (top-right)
- Patient table with sortable columns
- Pagination controls

### Clinical Record (Expediente Clínico)
- Left: Patient summary card (photo, demographics, alerts)
- Center: Tabbed interface (Historia Clínica, Notas Médicas, Estudios, Recetas, Signos Vitales)
- Right: Quick actions (Nueva Nota, Ordenar Estudio, Firmar)
- Timeline view option toggle

### Medical Note Form
- Full-width layout with section headers
- Structured fields: Fecha, Médico, Motivo de Consulta, Exploración Física, Diagnósticos, Plan
- Auto-save indicator
- Submit and Sign button (bottom-right)

---

## Accessibility & Compliance

- High contrast text (WCAG AAA for medical data)
- Keyboard navigation for all forms
- ARIA labels for screen readers
- Focus indicators clearly visible
- Audit trail footer on all clinical documents showing: Created by, Date, Last modified, Signature status
- Role-based UI: Hide/show features based on user permissions

---

## Responsive Behavior

- **Desktop (lg+)**: Full three-column layout with sidebar
- **Tablet (md)**: Collapsible sidebar, two-column content
- **Mobile (base)**: Single column, hamburger menu, simplified tables (convert to cards)
- Forms: Stack fields vertically on mobile
- Tables: Horizontal scroll or card conversion on small screens

---

## Visual Hierarchy Rules

1. **Patient name and ID**: Always prominent at top of clinical views
2. **Critical alerts**: Red banner at page top (allergies, contraindications)
3. **Recent first**: Reverse chronological order for medical events
4. **Status indicators**: Consistent positioning (top-right of cards)
5. **Action buttons**: Bottom-right for primary actions, top-right for secondary

---

This design creates a professional, efficient medical interface that prioritizes clinician workflow while maintaining strict compliance with NOM-024-SSA3-2012 requirements.