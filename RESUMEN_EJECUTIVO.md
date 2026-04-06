## Resumen Ejecutivo — Esculapio

---

### ¿Qué es Esculapio?
**Esculapio** es una plataforma SaaS de **Expediente Clínico Electrónico (ECE)** de alto rendimiento, diseñada específicamente para el mercado médico mexicano. El sistema garantiza el cumplimiento estricto de las normativas **NOM-024-SSA3-2012** (sistemas de registro electrónico) y **NOM-004-SSA3-2012** (contenido del expediente clínico), ofreciendo una solución robusta, segura y escalable para la gestión integral de servicios de salud.

---

### Stack Tecnológico (Moderno & Escalable)
La arquitectura utiliza tecnologías de última generación para asegurar una experiencia de usuario fluida y una infraestructura backend sólida:

| Capa | Tecnologías |
|------|------------|
| **Frontend** | React 18, Vite 8, Tailwind CSS 4, shadcn/ui, TanStack Query |
| **Backend** | Node.js (Express 4), TypeScript 5, Drizzle ORM, PostgreSQL |
| **Integridad** | Zod (Fuente única de verdad para esquemas y validación) |
| **Seguridad** | Passport.js, Cifrado AES-256, BCrypt (12 rondas), 2FA/TOTP |

---

### Módulos Estratégicos

**1. Core Clínico (EHR)**
- **Expediente Integral:** Antecedentes (AHF, APNP, APP, AGO), notas médicas multiformato (SOAP, quirúrgicas, enfermería) y seguimiento de signos vitales.
- **Gestión Médica:** Catálogo CIE-10 oficial, generación de recetas digitales y órdenes de laboratorio.
- **Firma Electrónica:** Garantía de integridad e inmutabilidad de documentos mediante firmas digitales basadas en hashes SHA-256.

**2. Engagement del Paciente (Portal de Citas)**
*Módulo integrado para la optimización de la atención y agenda médica:*
- **Booking Inteligente:** Agendamiento de citas en tiempo real con validación automática de disponibilidad y gestión de horarios.
- **Comunicación Automatizada:** Flujos de confirmación, reagendamiento y cancelación vía email con links seguros.
- **Asistencia con IA:** Chatbot integrado (Google Gemini) para atención preliminar y soporte al paciente.

**3. Interoperabilidad y Seguridad**
- **HL7 FHIR R4:** Implementación de 18+ endpoints bajo el estándar internacional, permitiendo el intercambio seguro de información de salud.
- **Seguridad de Grado Médico:** Control de acceso basado en roles (RBAC), auditoría completa de acciones (Audit Trail) y cifrado de campos sensibles (CURP, datos de contacto) en reposo.
- **Arquitectura Multi-tenant:** Aislamiento lógico de datos por organización, diseñado para operación SaaS masiva.

---

### Estado de Madurez
El proyecto se encuentra en estado **Production-Ready**, con una arquitectura limpia basada en el patrón de repositorio y una cobertura de pruebas superior al 80% (Vitest/Supertest). La documentación técnica está centralizada mediante Swagger (`/api-docs`), asegurando una integración sencilla para futuros desarrollos o auditorías técnicas.
