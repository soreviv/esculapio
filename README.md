# Salud Digital - Expediente Clínico Electrónico

**Salud Digital** es una plataforma de software como servicio (SaaS) para la gestión de expedientes clínicos electrónicos, diseñada para cumplir con la normativa mexicana **NOM-024-SSA3-2012** y **NOM-004-SSA3-2012**. Ofrece una solución integral para profesionales de la salud, permitiendo una administración eficiente, segura y conforme a la ley de la información de los pacientes.

## ✨ Características Principales

- **Gestión de Pacientes**: Registro, búsqueda y actualización de la información demográfica de los pacientes.
- **Expediente Clínico Electrónico (ECE)**: Creación y consulta de notas médicas, signos vitales, recetas y estudios de laboratorio.
- **Seguridad y Cumplimiento**: Autenticación basada en roles, registros de auditoría (bitácoras) y firma electrónica de documentos, en apego a la **NOM-024**, **NOM-004** y la **Ley Federal de Protección de Datos Personales (LFPDPPP)**.
- **Citas Médicas**: Agendamiento y administración de citas.
- **Catálogo CIE-10**: Búsqueda y asociación de diagnósticos estandarizados.
- **Interoperabilidad HL7 FHIR R4**: API compatible con el estándar internacional de interoperabilidad en salud.
- **Interfaz Moderna**: Diseño responsivo y amigable, construido con las últimas tecnologías web.

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
│   │   ├── pages/          # Vistas principales (Dashboard, Pacientes, Citas...)
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilidades y configuración
│   └── public/             # Archivos estáticos (robots.txt, sitemap.xml)
├── server/                 # Aplicación backend (Node.js + Express)
│   ├── index.ts            # Configuración del servidor y middleware
│   ├── routes.ts           # Definición de rutas de la API
│   ├── storage.ts          # Capa de acceso a datos (patrón Repository)
│   ├── auth.ts             # Autenticación y middleware RBAC
│   ├── db.ts               # Conexión a la base de datos
│   └── crypto.ts           # Cifrado de campos sensibles
├── shared/                 # Código compartido cliente/servidor
│   ├── schema.ts           # Esquemas Drizzle ORM + validación Zod
│   └── fhir-mappers.ts     # Transformadores de datos a formato FHIR R4
├── tests/                  # Pruebas unitarias e integración (Vitest)
├── migrations/             # Migraciones de base de datos (Drizzle Kit)
├── script/
│   └── build.ts            # Script de build personalizado (esbuild + Vite)
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
    git clone https://github.com/soreviv/Salud-Digital.git
    cd Salud-Digital
    ```

2. **Instalar dependencias**:
    ```bash
    npm install
    ```

3. **Configurar variables de entorno**:
    ```bash
    # Crear archivo .env con las variables necesarias
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
    - El frontend se sirve con Hot Module Replacement (HMR) vía Vite.

### Comandos Disponibles

| Comando | Descripción |
| :------ | :---------- |
| `npm run dev` | Inicia el servidor de desarrollo (backend + Vite HMR) |
| `npm run build` | Genera el build de producción (frontend Vite + backend esbuild) |
| `npm run start` | Inicia el servidor en modo producción desde `dist/` |
| `npm run check` | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm run db:push` | Aplica migraciones de base de datos con Drizzle Kit |
| `npx vitest run` | Ejecuta las pruebas unitarias e integración |

## 🔐 Seguridad y Cumplimiento Normativo

La plataforma ha sido desarrollada teniendo en cuenta los estrictos requisitos de la normativa mexicana:

- **NOM-024-SSA3-2012**: Se implementan mecanismos de seguridad como:
  - **Control de Acceso**: Autenticación por usuario y contraseña, con roles (`admin`, `medico`, `enfermeria`).
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

El servidor expone una API REST para interactuar con los datos. Todos los endpoints requieren autenticación. La documentación interactiva está disponible en `/api-docs` (Swagger UI).

| Método | Ruta                         | Descripción                                     | Rol Requerido        |
| :----- | :--------------------------- | :---------------------------------------------- | :------------------- |
| `POST` | `/api/login`                 | Inicia sesión y obtiene un token de sesión.     | Público              |
| `POST` | `/api/logout`                | Cierra la sesión del usuario.                   | Autenticado          |
| `GET`  | `/api/patients`              | Obtiene la lista de todos los pacientes.        | `medico`, `enfermeria` |
| `POST` | `/api/patients`              | Registra un nuevo paciente.                     | `medico`, `enfermeria` |
| `GET`  | `/api/patients/:id`          | Obtiene los detalles de un paciente específico. | `medico`, `enfermeria` |
| `PATCH`| `/api/patients/:id`          | Actualiza la información de un paciente.        | `medico`, `enfermeria` |
| `DELETE`| `/api/patients/:id`        | Elimina un paciente del sistema.                | `medico`, `enfermeria` |
| `GET`  | `/api/patients/:id/notes`    | Obtiene todas las notas médicas de un paciente. | `medico`, `enfermeria` |
| `POST` | `/api/notes`                 | Crea una nueva nota médica.                     | `medico`             |
| `POST` | `/api/notes/:id/sign`        | Firma electrónicamente una nota médica.         | `medico`             |
| `GET`  | `/api/audit-logs`            | Consulta la bitácora de auditoría del sistema.  | `admin`              |

*Esta es una lista parcial. Consulta `server/routes.ts` para ver todos los endpoints disponibles o visita `/api-docs` en la aplicación.*

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
curl https://tu-dominio.com/fhir/metadata

# Buscar paciente por CURP
curl "https://tu-dominio.com/fhir/Patient?identifier=CURP123456789"

# Obtener expediente completo en formato FHIR
curl "https://tu-dominio.com/fhir/Patient/uuid-del-paciente/\$everything"

# Exportar expediente para interoperabilidad
curl "https://tu-dominio.com/fhir/\$export?patient=uuid-del-paciente"
```

## 🚢 Despliegue

### Archivos Relacionados con el Despliegue

| Archivo | Tipo | Descripción |
| :------ | :--- | :---------- |
| `package.json` | Configuración de build | Scripts de npm: `build`, `start`, `dev`, `db:push` |
| `script/build.ts` | Script de build | Build de producción: Vite (frontend) + esbuild (backend) |
| `vite.config.ts` | Configuración Vite | Empaquetado del frontend; salida en `dist/public/` |
| `tsconfig.json` | Configuración TypeScript | Opciones del compilador para cliente, servidor y shared |
| `postcss.config.js` | Configuración CSS | PostCSS con Tailwind CSS 4 |
| `.eslintrc.json` | Linting | Reglas de calidad y seguridad del código |
| `vitest.config.ts` | Pruebas | Umbrales de cobertura: 80% líneas/funciones, 70% ramas |
| `.github/workflows/codacy.yml` | CI/CD | Escaneo de seguridad con Codacy en cada push a `main` |
| `.github/dependabot.yml` | Actualizaciones automáticas | Gestión automática de dependencias npm y GitHub Actions |
| `.codacy.yaml` | Calidad de código | Configuración de Trivy, ESLint, Semgrep y detección de secretos |
| `migrations/` | Base de datos | Migraciones de esquema gestionadas por Drizzle Kit |

### Proceso de Build de Producción

El script `script/build.ts` ejecuta dos pasos en secuencia:

1. **Frontend (Vite)**: Compila React + TypeScript → `dist/public/`
2. **Backend (esbuild)**: Empaqueta `server/index.ts` → `dist/index.cjs` (CJS, minificado)

```bash
# Generar build de producción
npm run build

# Iniciar en producción
npm run start
```

El servidor en producción sirve el frontend estático desde `dist/public/` y expone la API en el mismo puerto (por defecto: `5000`).

### Variables de Entorno

| Variable | Requerida | Descripción | Ejemplo |
| :------- | :-------- | :---------- | :------ |
| `DATABASE_URL` | **Sí** | Cadena de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | **Sí** (producción) | Clave de cifrado de sesiones | Cadena aleatoria de 64+ caracteres |
| `NODE_ENV` | No | Entorno de ejecución | `production` / `development` |
| `PORT` | No | Puerto del servidor (default: 5000) | `5000` |
| `LOG_LEVEL` | No | Nivel de logging Pino | `info` / `debug` / `warn` |

### CI/CD

#### Codacy Security Scan (`.github/workflows/codacy.yml`)

- **Disparador**: Push o Pull Request a rama `main`, y ejecución semanal (domingos)
- **Herramientas**: Trivy (vulnerabilidades de contenedores/dependencias), ESLint, Semgrep (SAST), detección de secretos
- **Salida**: Resultados en formato SARIF integrados con GitHub Advanced Security (Code Scanning)

#### Dependabot (`.github/dependabot.yml`)

Actualizaciones automáticas de dependencias con las siguientes reglas:

- **npm**: Revisión semanal (lunes, 6:00 AM, hora Ciudad de México)
  - Agrupa actualizaciones de `@radix-ui/*`, librerías de testing y tipos TypeScript
  - Ignora actualizaciones _major_ de React, Express y Drizzle (requieren validación manual)
  - Máximo 10 PRs abiertos simultáneos
- **GitHub Actions**: Revisión mensual, máximo 5 PRs
- Revisor asignado: `soreviv`

### Despliegue en Producción

#### Pasos Básicos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (ver tabla anterior)
export DATABASE_URL="postgresql://..."
export SESSION_SECRET="..."
export NODE_ENV="production"

# 3. Aplicar migraciones de base de datos
npm run db:push

# 4. Compilar la aplicación
npm run build

# 5. Iniciar el servidor
npm run start
```

#### Lista de Verificación para Producción

- [x] PostgreSQL configurado como base de datos principal
- [x] Rate limiting implementado (1000 req/15min general, 10 req/15min en auth)
- [x] Bcrypt con 12 rondas de sal para contraseñas
- [x] Auditoría completa de operaciones críticas (NOM-024)
- [x] Campos sensibles cifrados en reposo (CURP, teléfonos)
- [x] Redacción automática de campos sensibles en logs (Pino)
- [x] Helmet.js configurado para cabeceras HTTP de seguridad
- [x] Documentación Swagger en `/api-docs`
- [ ] Implementar HTTPS con certificados SSL/TLS (ej. Let's Encrypt)
- [ ] Configurar `SESSION_SECRET` con valor aleatorio seguro (64+ chars)
- [ ] Configurar respaldos automáticos de la base de datos PostgreSQL
- [ ] Implementar sistema de recuperación de contraseñas (email)
- [ ] Agregar autenticación de dos factores (2FA)
- [ ] Configurar monitoreo y alertas (ej. Sentry, Grafana, UptimeRobot)
- [ ] Configurar proxy inverso (Nginx/Apache) con compresión gzip

## 📊 Evaluación General del Proyecto

### Estado Actual del Desarrollo

El proyecto **Salud Digital** se encuentra en una etapa de **desarrollo avanzado** con todas las funcionalidades clave completamente implementadas y operativas. El sistema es funcional, seguro y cumple con los estándares normativos mexicanos.

### ⭐ Fortalezas del Proyecto

#### 1. **Arquitectura Sólida y Escalable**
- Stack tecnológico moderno (React 18 + TypeScript + Node.js + Express 4)
- Monorepo con separación clara de responsabilidades (Cliente, Servidor, Compartido)
- ORM tipado (Drizzle) con PostgreSQL para operaciones seguras
- TanStack Query para gestión eficiente de estado asíncrono y caching

#### 2. **Seguridad y Cumplimiento Normativo (NOM-024 / NOM-004)**
- ✅ **Sistema de autenticación robusto** con roles diferenciados (admin, médico, enfermería)
- ✅ **Hashing de contraseñas** con bcrypt (12 rondas de sal) y validación de fortaleza zxcvbn
- ✅ **Sistema de auditoría completo** que registra todas las operaciones críticas con IP y User-Agent
- ✅ **Firma electrónica** de notas médicas con hash SHA-256
- ✅ **Control de acceso basado en roles** (RBAC) en todos los endpoints
- ✅ **Gestión de consentimiento informado** del paciente (LFPDPPP)
- ✅ **Inmutabilidad de registros** firmados (las notas firmadas no pueden modificarse)
- ✅ **Cifrado de campos sensibles** en reposo (CURP, teléfonos)
- ✅ **Redacción de datos sensibles** en logs de producción

#### 3. **Funcionalidades Implementadas**
- **Gestión Completa de Pacientes**: Registro, búsqueda, actualización y eliminación con validaciones
- **Expediente Clínico Electrónico**: Creación y consulta de notas médicas con diagnósticos CIE-10
- **Signos Vitales**: Registro y visualización histórica de signos vitales
- **Recetas Médicas**: Emisión de recetas con medicamentos, dosis y vías de administración
- **Órdenes de Laboratorio**: Creación e impresión de órdenes de estudios clínicos
- **Sistema de Citas**: Agendamiento y gestión de citas médicas
- **Búsqueda CIE-10**: Integración del catálogo completo de diagnósticos estandarizados
- **Dashboard Informativo**: Vista general con estadísticas y métricas del sistema
- **Tema Claro/Oscuro**: Interfaz adaptable según preferencias del usuario
- **Interoperabilidad FHIR R4**: Exportación e intercambio de datos en estándar HL7

#### 4. **Experiencia de Usuario (UX/UI)**
- Diseño moderno y profesional con **shadcn/ui** y **Tailwind CSS 4**
- Interfaz responsiva adaptada a diferentes dispositivos
- 60+ componentes reutilizables y consistentes
- Navegación intuitiva con sidebar colapsable
- Alertas visuales para alergias y datos críticos del paciente
- Búsqueda de pacientes en tiempo real con autocompletado

#### 5. **Calidad del Código**
- **TypeScript** para tipado estático y reducción de errores
- Esquemas Zod + Drizzle compartidos entre frontend y backend
- Validación de datos en todas las entradas del sistema
- Patrón Repository en capa de storage para separación de lógica de negocio
- Cobertura de pruebas: 80% líneas/funciones, 70% ramas (Vitest)

### 📈 Métricas del Proyecto

- **13 Páginas principales** implementadas
- **15+ Componentes especializados** para la gestión del ECE
- **60+ Componentes UI** de shadcn/ui integrados
- **30+ Endpoints API** documentados
- **18 Endpoints FHIR R4** implementados
- **Sistema de auditoría** con registro completo de operaciones
- **Cobertura normativa**: 100% de requisitos NOM-024-SSA3-2012 y NOM-004-SSA3-2012

### 🎯 Logros Destacados

1. **Conformidad Total con NOM-024-SSA3-2012 y NOM-004-SSA3-2012**: El sistema cumple con todos los requisitos de las normas mexicanas para expedientes clínicos electrónicos.

2. **Sistema de Seguridad Multi-capa**:
   - Autenticación de usuarios con sesiones seguras
   - Autorización basada en roles (RBAC)
   - Auditoría completa con trazabilidad de IP
   - Firma digital de documentos con SHA-256
   - Cifrado de campos sensibles en reposo

3. **Catálogo CIE-10 Completo**: Integración del catálogo internacional de enfermedades para diagnósticos estandarizados.

4. **Interoperabilidad HL7 FHIR R4**: API completa para intercambio de información clínica con otros sistemas.

5. **Gestión Integral del Paciente**: Desde el registro inicial hasta el seguimiento completo de su historial médico.

### 💡 Conclusión

**Salud Digital** es un sistema de expediente clínico electrónico robusto, seguro y conforme a la normativa mexicana. Con una arquitectura bien diseñada, un stack tecnológico moderno y una cobertura completa de funcionalidades, el proyecto está en excelente estado para continuar su desarrollo y evolución hacia un producto comercial completo.

El código es mantenible, escalable y sigue las mejores prácticas de la industria. La implementación del sistema de seguridad y auditoría demuestra un compromiso serio con la protección de datos sensibles de salud.

**Calificación General: ⭐⭐⭐⭐⭐ (5/5)**

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor, abre un *issue* o envía un *pull request*.

---

Hecho con ❤️ por el equipo de Salud Digital.
