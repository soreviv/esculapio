# Salud Digital - Expediente Clínico Electrónico

**Salud Digital** es una plataforma de software como servicio (SaaS) para la gestión de expedientes clínicos electrónicos, diseñada para cumplir con la normativa mexicana **NOM-024-SSA3-2012** y **NOM-004-SSA3-2012**. Ofrece una solución integral para profesionales de la salud, permitiendo una administración eficiente, segura y conforme a la ley de la información de los pacientes.

## ✨ Características Principales

- **Gestión de Pacientes**: Registro, búsqueda y actualización de la información demográfica de los pacientes.
- **Expediente Clínico Electrónico (ECE)**: Creación y consulta de notas médicas, signos vitales, recetas y estudios de laboratorio.
- **Portal Público para Pacientes**: Portal web accesible desde el dominio raíz (`/`) con agendamiento de citas en línea, información de servicios, formulario de contacto y chatbot con IA (Gemini).
- **Seguridad y Cumplimiento**: Autenticación basada en roles, registros de auditoría (bitácoras) y firma electrónica de documentos, en apego a la **NOM-024**, **NOM-004** y la **Ley Federal de Protección de Datos Personales (LFPDPPP)**.
- **Citas Médicas**: Agendamiento y administración de citas, con soporte para bloqueo de períodos (vacaciones, permisos).
- **Catálogo CIE-10**: Búsqueda y asociación de diagnósticos estandarizados.
- **Interoperabilidad HL7 FHIR R4**: API compatible con el estándar internacional de interoperabilidad en salud.
- **Interfaz Moderna**: Diseño responsivo y amigable, construido con las últimas tecnologías web.

## 🌐 Estructura de URLs

| URL | Descripción | Acceso |
| :-- | :---------- | :----- |
| `/` | Portal público para pacientes | Público |
| `/cita` | Agendar cita en línea | Público |
| `/servicios` | Servicios del consultorio | Público |
| `/contacto` | Formulario de contacto | Público |
| `/login` | Acceso al EHR (médicos y staff) | Staff |
| `/dashboard` | Panel principal del EHR | Autenticado |
| `/pacientes` | Gestión de pacientes | Autenticado |
| `/citas` | Administración de citas | Autenticado |
| `/configuracion` | Configuración del sistema | Admin |
| `/api-docs` | Documentación Swagger de la API | Autenticado |

> Las rutas `/p/:slug/*` siguen funcionando para compatibilidad y entornos de desarrollo.

## 🚀 Tecnologías Utilizadas

El proyecto está construido con un stack de tecnologías moderno, robusto y escalable:

- **Frontend**:
  - [**React 18**](https://react.dev/): Biblioteca para construir interfaces de usuario.
  - [**TypeScript 5**](https://www.typescriptlang.org/): Tipado estático para un desarrollo más seguro.
  - [**Vite 7**](https://vitejs.dev/): Herramienta de desarrollo frontend de alta velocidad.
  - [**TanStack Query**](https://tanstack.com/query/latest): Gestión de estado asíncrono y caching de datos.
  - [**Tailwind CSS 4**](https://tailwindcss.com/): Framework de CSS para un diseño rápido y personalizable.
  - [**shadcn/ui**](https://ui.shadcn.com/): Componentes de UI accesibles y reutilizables (60+ componentes).
  - [**Wouter**](https://github.com/molefrog/wouter): Enrutamiento ligero para React.

- **Backend**:
  - [**Node.js**](https://nodejs.org/): Entorno de ejecución para JavaScript del lado del servidor.
  - [**Express 4**](https://expressjs.com/): Framework minimalista para aplicaciones web y APIs.
  - [**Drizzle ORM**](https://orm.drizzle.team/): ORM tipado para una interacción segura con la base de datos.
  - [**PostgreSQL**](https://www.postgresql.org/): Base de datos relacional robusta para producción.
  - [**Passport.js**](https://www.passportjs.org/): Autenticación con sesiones.
  - [**Pino**](https://getpino.io/): Logger de alto rendimiento para Node.js.

- **Compartido (Shared)**:
  - [**Zod**](https://zod.dev/): Validación de esquemas compartida entre frontend y backend.
  - Definiciones de tipos TypeScript compartidas via `shared/schema.ts`.

## 📁 Estructura del Proyecto

El monorepo está organizado de la siguiente manera para una clara separación de responsabilidades:

```
/
├── client/                 # Aplicación frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # Componentes shadcn/ui (60+)
│   │   │   └── ehr/        # Componentes especializados de salud
│   │   ├── pages/
│   │   │   ├── portal/     # Portal público para pacientes
│   │   │   └── ...         # Páginas del EHR
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilidades y configuración
│   └── public/             # Archivos estáticos (robots.txt, sitemap.xml)
├── server/                 # Aplicación backend (Node.js + Express)
│   ├── index.ts            # Configuración del servidor y middleware
│   ├── routes.ts           # Rutas del EHR
│   ├── portal-routes.ts    # Rutas públicas del portal (/p/:slug/api/*)
│   ├── storage.ts          # Capa de acceso a datos (patrón Repository)
│   ├── auth.ts             # Autenticación y middleware RBAC
│   ├── tenant.ts           # Resolución multi-tenant por slug/subdominio
│   ├── db.ts               # Conexión a la base de datos
│   └── crypto.ts           # Cifrado de campos sensibles
├── shared/                 # Código compartido cliente/servidor
│   ├── schema.ts           # Esquemas Drizzle ORM + validación Zod
│   └── fhir-mappers.ts     # Transformadores de datos a formato FHIR R4
├── tests/                  # Pruebas unitarias e integración (Vitest)
├── migrations/             # Migraciones de base de datos (Drizzle Kit)
├── scripts/
│   ├── build.ts            # Script de build personalizado (esbuild + Vite)
│   ├── deploy.sh           # Script de deploy (build + reinicio PM2)
│   ├── setup-env.cjs       # Generador de claves seguras para .env
│   ├── seed-admin.ts       # Crea el usuario admin inicial
│   ├── import-cie10-dgis.ts # Importa catálogo CIE-10 oficial DGIS
│   └── backup-db.sh        # Backup automático de PostgreSQL
└── dist/                   # Artefactos de producción (generado por build)
    ├── index.cjs           # Servidor backend compilado
    └── public/             # Frontend compilado
```

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) 14 o superior
- npm 9 o superior

### Desarrollo Local

1. **Clonar el repositorio**:
    ```bash
    git clone https://github.com/soreviv/esculapio.git
    cd esculapio
    ```

2. **Instalar dependencias**:
    ```bash
    npm install
    ```

3. **Configurar variables de entorno**:
    ```bash
    DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/salud_digital
    SESSION_SECRET=tu-secreto-seguro-aqui
    NODE_ENV=development
    PORT=5000
    LOG_LEVEL=debug
    ```

4. **Aplicar migraciones de base de datos**:
    ```bash
    npm run db:push
    ```

5. **Iniciar la aplicación en modo desarrollo**:
    ```bash
    npm run dev
    ```
    - La aplicación estará disponible en `http://localhost:5000`.
    - Portal del paciente: `http://localhost:5000/p/<slug>`
    - EHR: `http://localhost:5000/login`

### Comandos Disponibles

| Comando | Descripción |
| :------ | :---------- |
| `npm run dev` | Inicia el servidor de desarrollo (backend + Vite HMR) |
| `npm run build` | Genera el build de producción (frontend Vite + backend esbuild) |
| `npm run start` | Inicia el servidor en modo producción desde `dist/` |
| `npm run check` | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm run db:push` | Aplica migraciones de base de datos con Drizzle Kit |
| `npm run setup` | Genera `SESSION_SECRET` y `ENCRYPTION_KEY` en `.env` |
| `npx vitest run` | Ejecuta las pruebas unitarias e integración |

## 🔐 Seguridad y Cumplimiento Normativo

La plataforma ha sido desarrollada teniendo en cuenta los estrictos requisitos de la normativa mexicana:

- **NOM-024-SSA3-2012**: Se implementan mecanismos de seguridad como:
  - **Control de Acceso**: Autenticación por usuario y contraseña, con roles (`admin`, `medico`, `enfermeria`).
  - **Autenticación de Dos Factores (2FA)**: TOTP compatible con Google Authenticator y apps similares.
  - **Bitácoras de Auditoría**: Registro detallado de todas las acciones críticas (creación, modificación, eliminación y consulta de datos sensibles), con IP y User-Agent.
  - **Inmutabilidad de Registros**: Las notas médicas firmadas no pueden ser alteradas. Solo se pueden agregar addenda.
  - **Firma Electrónica**: Se genera un hash SHA-256 único para firmar digitalmente las notas médicas, garantizando su integridad.

- **NOM-004-SSA3-2012**: Gestión del expediente clínico con campos requeridos: motivo de consulta, padecimiento actual, signos vitales, exploración física, diagnóstico CIE-10 y pronóstico.

- **LFPDPPP**: Se gestiona el consentimiento del paciente para el tratamiento de sus datos personales y del expediente clínico a través de registros de consentimiento.

## 🗺️ SEO y Optimización

El proyecto incluye configuración optimizada para motores de búsqueda:

- **sitemap.xml**: Mapa del sitio con todas las rutas públicas de la aplicación (`client/public/sitemap.xml`)
- **robots.txt**: Control de indexación y directrices para web crawlers (`client/public/robots.txt`)
- **Meta tags**: Configuración de metadatos para redes sociales y SEO
- **URLs semánticas**: Rutas descriptivas y amigables para usuarios y buscadores

## 📄 API Endpoints

El servidor expone una API REST para interactuar con los datos. Todos los endpoints del EHR requieren autenticación. La documentación interactiva está disponible en `/api-docs` (Swagger UI).

| Método | Ruta                         | Descripción                                     | Rol Requerido        |
| :----- | :--------------------------- | :---------------------------------------------- | :------------------- |
| `POST` | `/api/login`                 | Inicia sesión y obtiene un token de sesión.     | Público              |
| `POST` | `/api/logout`                | Cierra la sesión del usuario.                   | Autenticado          |
| `GET`  | `/api/patients`              | Obtiene la lista de todos los pacientes.        | `medico`, `enfermeria` |
| `POST` | `/api/patients`              | Registra un nuevo paciente.                     | `medico`, `enfermeria` |
| `GET`  | `/api/patients/:id`          | Obtiene los detalles de un paciente específico. | `medico`, `enfermeria` |
| `PATCH`| `/api/patients/:id`          | Actualiza la información de un paciente.        | `medico`, `enfermeria` |
| `GET`  | `/api/patients/:id/notes`    | Obtiene todas las notas médicas de un paciente. | `medico`, `enfermeria` |
| `POST` | `/api/notes`                 | Crea una nueva nota médica.                     | `medico`             |
| `POST` | `/api/notes/:id/sign`        | Firma electrónicamente una nota médica.         | `medico`             |
| `GET`  | `/api/portal-settings`       | Configuración del portal (horarios, bloqueos).  | `admin`              |
| `PATCH`| `/api/portal-settings`       | Actualiza configuración del portal.             | `admin`              |
| `GET`  | `/api/audit-logs`            | Consulta la bitácora de auditoría del sistema.  | `admin`              |

*Esta es una lista parcial. Consulta `server/routes.ts` para ver todos los endpoints disponibles o visita `/api-docs` en la aplicación.*

### API Pública del Portal

Los siguientes endpoints son públicos (sin autenticación) y están disponibles para el portal de pacientes:

| Método | Ruta | Descripción |
| :----- | :--- | :---------- |
| `GET`  | `/p/:slug/api/portal-info` | Información pública del consultorio |
| `GET`  | `/p/:slug/api/slots?fecha=YYYY-MM-DD` | Horarios disponibles para una fecha |
| `POST` | `/p/:slug/api/appointments` | Crear cita desde el portal |
| `GET`  | `/p/:slug/api/appointments/confirm?token=` | Confirmar cita por email |
| `GET`  | `/p/:slug/api/appointments/cancel?token=` | Cancelar cita por email |
| `POST` | `/p/:slug/api/contact` | Enviar mensaje de contacto |
| `POST` | `/p/:slug/api/chat` | Chatbot IA (requiere clave Gemini) |

## 🔗 API HL7 FHIR R4

El sistema implementa **HL7 FHIR R4** para interoperabilidad con otros sistemas de salud, conforme a la reforma de ley que requiere que todos los EHR sean compatibles con este estándar.

### Endpoints FHIR

| Método | Ruta | Descripción |
| :----- | :--- | :---------- |
| `GET` | `/fhir/metadata` | CapabilityStatement - Capacidades del servidor |
| `GET` | `/fhir/Patient` | Búsqueda de pacientes |
| `GET` | `/fhir/Patient/:id` | Obtener paciente por ID |
| `GET` | `/fhir/Patient/:id/$everything` | Expediente completo del paciente |
| `GET` | `/fhir/Practitioner` | Búsqueda de profesionales de salud |
| `GET` | `/fhir/Practitioner/:id` | Obtener profesional por ID |
| `GET` | `/fhir/Encounter` | Búsqueda de encuentros/consultas |
| `GET` | `/fhir/Encounter/:id` | Obtener encuentro por ID |
| `GET` | `/fhir/Condition` | Búsqueda de diagnósticos |
| `GET` | `/fhir/Observation` | Búsqueda de observaciones (signos vitales) |
| `GET` | `/fhir/Observation/:id` | Obtener observación por ID |
| `GET` | `/fhir/MedicationRequest` | Búsqueda de recetas |
| `GET` | `/fhir/MedicationRequest/:id` | Obtener receta por ID |
| `GET` | `/fhir/ServiceRequest` | Búsqueda de órdenes de laboratorio |
| `GET` | `/fhir/ServiceRequest/:id` | Obtener orden por ID |
| `GET` | `/fhir/Consent` | Búsqueda de consentimientos |
| `GET` | `/fhir/AuditEvent` | Eventos de auditoría |
| `GET` | `/fhir/$export?patient=:id` | Exportar expediente en formato FHIR Bundle |

### Recursos FHIR Soportados

| Recurso FHIR | Tabla Interna | Descripción |
| :----------- | :------------ | :---------- |
| `Patient` | `patients` | Datos demográficos del paciente |
| `Practitioner` | `users` | Profesionales de salud |
| `Encounter` | `medical_notes` | Consultas y notas médicas |
| `Condition` | CIE-10 en notas | Diagnósticos codificados |
| `Observation` | `vitals` | Signos vitales |
| `MedicationRequest` | `prescriptions` | Recetas médicas |
| `ServiceRequest` | `lab_orders` | Órdenes de laboratorio |
| `Consent` | `patient_consents` | Consentimientos informados |
| `AuditEvent` | `audit_logs` | Bitácora de auditoría |

### Ejemplo de uso

```bash
# Obtener capacidades del servidor
curl https://otorrinonet.com/fhir/metadata

# Buscar paciente por CURP
curl "https://otorrinonet.com/fhir/Patient?identifier=CURP123456789"

# Obtener expediente completo en formato FHIR
curl "https://otorrinonet.com/fhir/Patient/uuid-del-paciente/\$everything"
```

## 🚢 Despliegue

### Variables de Entorno

| Variable | Requerida | Descripción | Ejemplo |
| :------- | :-------- | :---------- | :------ |
| `DATABASE_URL` | **Sí** | Cadena de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | **Sí** | Clave de cifrado de sesiones (64+ chars hex) | `openssl rand -hex 64` |
| `ENCRYPTION_KEY` | **Sí** | Clave de cifrado de campos sensibles (32 bytes hex) | `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | **Sí** (primer deploy) | Contraseña del usuario admin inicial | `AdminSeguro2026!` |
| `NODE_ENV` | No | Entorno de ejecución | `production` / `development` |
| `PORT` | No | Puerto del servidor (default: 5000) | `5000` |
| `LOG_LEVEL` | No | Nivel de logging Pino | `info` / `debug` / `warn` |
| `BASE_DOMAIN` | No | Dominio base para resolución multi-tenant por subdominio | `salud-digital.mx` |
| `SMTP_HOST` | No | Servidor SMTP para emails | `smtp.mailgun.org` |
| `SMTP_PORT` | No | Puerto SMTP | `587` |
| `SMTP_USER` | No | Usuario SMTP | `user@dominio.com` |
| `SMTP_PASS` | No | Contraseña SMTP | — |
| `SMTP_FROM` | No | Dirección de envío | `noreply@dominio.com` |
| `APP_BASE_URL` | No | URL base de la app (para links en emails) | `https://otorrinonet.com` |

### Proceso de Build y Deploy

```bash
# Generar build de producción
npm run build

# Iniciar / reiniciar con PM2
pm2 restart all

# O todo en un paso (desde Claude Code con /push):
# git add + commit + push → npm install → npm run build → pm2 restart all
```

El servidor en producción sirve el frontend estático desde `dist/public/` y expone la API en el mismo puerto (por defecto: `5000`).

### Lista de Verificación para Producción

- [x] PostgreSQL configurado como base de datos principal
- [x] Rate limiting implementado (1000 req/15min general, 10 req/15min en auth)
- [x] Bcrypt con 12 rondas de sal para contraseñas
- [x] Autenticación de dos factores (2FA) con TOTP
- [x] Auditoría completa de operaciones críticas (NOM-024)
- [x] Campos sensibles cifrados en reposo (CURP, teléfonos)
- [x] Redacción automática de campos sensibles en logs (Pino)
- [x] Helmet.js configurado para cabeceras HTTP de seguridad
- [x] Documentación Swagger en `/api-docs`
- [x] HTTPS con certificados SSL/TLS (Let's Encrypt + Nginx)
- [x] `SESSION_SECRET` y `ENCRYPTION_KEY` con valores aleatorios seguros
- [x] Respaldos automáticos de la base de datos PostgreSQL (`scripts/backup-db.sh`)
- [x] Sistema de recuperación de contraseñas (email)
- [x] Proxy inverso Nginx con compresión gzip
- [ ] Configurar monitoreo y alertas (ej. Sentry, Grafana, UptimeRobot)

### CI/CD

#### Codacy Security Scan (`.github/workflows/codacy.yml`)

- **Disparador**: Push o Pull Request a rama `main`, y ejecución semanal (domingos)
- **Herramientas**: Trivy (vulnerabilidades de contenedores/dependencias), ESLint, Semgrep (SAST), detección de secretos
- **Salida**: Resultados en formato SARIF integrados con GitHub Advanced Security (Code Scanning)

#### Dependabot (`.github/dependabot.yml`)

- **npm**: Revisión semanal (lunes, 6:00 AM, hora Ciudad de México)
- **GitHub Actions**: Revisión mensual

## 📊 Estado del Proyecto

### Funcionalidades Implementadas

**EHR (Sistema de Expediente Clínico)**
- Gestión completa de pacientes (registro, búsqueda, historial)
- Notas médicas con diagnósticos CIE-10, firma electrónica e immutabilidad
- Signos vitales con visualización histórica
- Recetas médicas con medicamentos, dosis y vías de administración
- Órdenes de laboratorio
- Sistema de citas médicas con bloqueo de períodos (vacaciones, permisos)
- Dashboard con estadísticas y métricas
- Gestión de usuarios con roles (admin, médico, enfermería), 2FA, suspensión

**Portal Público para Pacientes**
- Página de inicio con información del consultorio
- Catálogo de servicios
- Agendamiento de citas en línea con validación de disponibilidad en tiempo real
- Formulario de contacto
- Chatbot con IA (Google Gemini)
- Confirmación, reagendamiento y cancelación de citas por email
- Respeta horarios de atención y períodos bloqueados configurados en el EHR

**Configuración y Administración**
- Configuración del establecimiento (nombre, dirección, RFC, logo)
- Horarios de atención por día de la semana
- Períodos bloqueados por rango de fechas (vacaciones, congresos, etc.)
- Portal habilitado/deshabilitado por tenant
- Preferencias de usuario (tema, notificaciones, formato de fecha/hora)

### Métricas

- **14+ páginas** implementadas en el EHR
- **10 páginas** del portal público para pacientes
- **15+ componentes especializados** para la gestión del ECE
- **60+ componentes UI** de shadcn/ui integrados
- **30+ endpoints API** del EHR documentados en Swagger
- **7 endpoints API públicos** del portal
- **18 endpoints FHIR R4** implementados
- **Cobertura normativa**: 100% NOM-024-SSA3-2012 y NOM-004-SSA3-2012

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor, abre un *issue* o envía un *pull request*.

---

Hecho con ❤️ por el equipo de Salud Digital.
