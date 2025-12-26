import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MediRecord API",
      version: "1.0.0",
      description: `
API del Sistema de Expediente Clínico Electrónico MediRecord.

## Cumplimiento Normativo
- **NOM-004-SSA3-2012**: Del Expediente Clínico
- **NOM-024-SSA3-2012**: Sistemas de Información de Registro Electrónico para la Salud (SIRES)
- **LFPDPPP**: Ley Federal de Protección de Datos Personales
- **COFEPRIS**: Requisitos de prescripciones y órdenes de laboratorio

## Autenticación
La API utiliza sesiones de Express con cookies httpOnly. Todas las rutas protegidas requieren autenticación previa mediante /api/login.

## Roles de Usuario
- **admin**: Acceso completo, gestión de usuarios y logs de auditoría
- **medico**: Gestión de pacientes, notas médicas, prescripciones
- **enfermeria**: Registro de signos vitales, notas de enfermería
      `,
      contact: {
        name: "Soporte MediRecord",
        email: "soporte@medirecord.mx",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Server",
      },
    ],
    tags: [
      { name: "Auth", description: "Autenticación y sesiones" },
      { name: "Patients", description: "Gestión de pacientes (NOM-004)" },
      { name: "Medical Notes", description: "Notas médicas (NOM-004/NOM-024)" },
      { name: "Vitals", description: "Signos vitales" },
      { name: "Prescriptions", description: "Prescripciones (COFEPRIS)" },
      { name: "Appointments", description: "Citas médicas" },
      { name: "Lab Orders", description: "Órdenes de laboratorio (COFEPRIS)" },
      { name: "Nursing Notes", description: "Notas de enfermería (NOM-004)" },
      { name: "Consents", description: "Consentimientos informados (NOM-004/LFPDPPP)" },
      { name: "CIE-10", description: "Catálogo de diagnósticos CIE-10" },
      { name: "Audit", description: "Logs de auditoría (NOM-024)" },
      { name: "Config", description: "Configuración del establecimiento" },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Cookie de sesión Express",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", description: "Mensaje de error" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string" },
            role: { type: "string", enum: ["admin", "medico", "enfermeria"] },
            nombre: { type: "string" },
            especialidad: { type: "string", nullable: true },
            cedula: { type: "string", nullable: true },
          },
        },
        Patient: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            numeroExpediente: { type: "string", description: "Número de expediente único (NOM-004)" },
            nombre: { type: "string" },
            apellidoPaterno: { type: "string" },
            apellidoMaterno: { type: "string", nullable: true },
            curp: { type: "string", pattern: "^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$" },
            fechaNacimiento: { type: "string", format: "date" },
            sexo: { type: "string", enum: ["M", "F"] },
            grupoSanguineo: { type: "string", nullable: true },
            telefono: { type: "string", nullable: true },
            email: { type: "string", format: "email", nullable: true },
            direccion: { type: "string", nullable: true },
            ocupacion: { type: "string", nullable: true },
            estadoCivil: { type: "string", nullable: true },
            alergias: { type: "array", items: { type: "string" }, nullable: true },
            status: { type: "string", enum: ["activo", "alta", "en_consulta"] },
          },
        },
        MedicalNote: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            medicoId: { type: "string", format: "uuid" },
            tipo: { 
              type: "string", 
              enum: ["historia_clinica", "nota_inicial", "nota_evolucion", "nota_interconsulta", "nota_referencia", "nota_ingreso", "nota_preoperatoria", "nota_postoperatoria", "nota_preanestesica", "nota_egreso"],
              description: "Tipo de nota según NOM-004"
            },
            fecha: { type: "string", format: "date-time" },
            motivoConsulta: { type: "string", nullable: true },
            padecimientoActual: { type: "string", nullable: true },
            exploracionFisica: { type: "string", nullable: true },
            diagnosticos: { type: "array", items: { type: "string" }, nullable: true },
            diagnosticosCie10: { type: "array", items: { type: "string" }, nullable: true },
            plan: { type: "string", nullable: true },
            firmada: { type: "boolean", description: "Indica si la nota está firmada electrónicamente (NOM-024)" },
            firmaHash: { type: "string", nullable: true, description: "Hash SHA-256 de la firma electrónica" },
          },
        },
        Vitals: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            fecha: { type: "string", format: "date-time" },
            presionSistolica: { type: "integer", nullable: true },
            presionDiastolica: { type: "integer", nullable: true },
            frecuenciaCardiaca: { type: "integer", nullable: true },
            frecuenciaRespiratoria: { type: "integer", nullable: true },
            temperatura: { type: "number", format: "float", nullable: true },
            saturacionOxigeno: { type: "integer", nullable: true },
            peso: { type: "number", format: "float", nullable: true },
            talla: { type: "integer", nullable: true },
          },
        },
        Prescription: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            medicoId: { type: "string", format: "uuid" },
            medicamento: { type: "string" },
            presentacion: { type: "string", nullable: true },
            dosis: { type: "string" },
            via: { type: "string" },
            frecuencia: { type: "string" },
            duracion: { type: "string", nullable: true },
            indicaciones: { type: "string", nullable: true },
            status: { type: "string", enum: ["activa", "completada", "cancelada"] },
          },
        },
        Appointment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            medicoId: { type: "string", format: "uuid" },
            fecha: { type: "string", format: "date" },
            hora: { type: "string", format: "time" },
            duracion: { type: "string" },
            motivo: { type: "string", nullable: true },
            status: { type: "string", enum: ["pendiente", "en_curso", "completada", "no_asistio"] },
          },
        },
        LabOrder: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            medicoId: { type: "string", format: "uuid" },
            estudios: { type: "array", items: { type: "string" } },
            diagnosticoPresuntivo: { type: "string", nullable: true },
            indicacionesClinicas: { type: "string", nullable: true },
            urgente: { type: "boolean" },
            ayuno: { type: "boolean" },
            status: { type: "string", enum: ["pendiente", "en_proceso", "completada", "cancelada"] },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid", nullable: true },
            accion: { type: "string", enum: ["crear", "leer", "actualizar", "eliminar", "firmar", "acceso"] },
            entidad: { type: "string" },
            entidadId: { type: "string", nullable: true },
            detalles: { type: "string", nullable: true },
            ipAddress: { type: "string", nullable: true },
            fecha: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ sessionAuth: [] }],
  },
  apis: ["./server/routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
