# Skill: Medical Compliance & Interoperability (NOM + FHIR)

Este skill especializa a Gemini CLI en el desarrollo y auditoría de sistemas de salud, con enfoque específico en la normativa mexicana y el estándar HL7 FHIR R4.

## 📋 Contexto de Activación
Activar este skill cuando se trabaje en:
- Endpoints de la API que manejen datos de pacientes o notas médicas.
- Implementación de lógica de interoperabilidad (FHIR).
- Procesos de firma electrónica o auditoría.
- Modificaciones al esquema de base de datos relacionado con el expediente clínico.

## ⚖️ Mandatos Normativos (NOM-004 / NOM-024)
- **Trazabilidad Total:** Antes de dar por terminada una tarea en el backend, verifica que cada acción (CREATE, READ, UPDATE, DELETE) sobre datos sensibles esté registrada en `audit_logs` con IP y UserAgent.
- **Inmutabilidad de Firma:** Si se modifica el flujo de notas médicas, garantiza que una nota con `firmada: true` NUNCA pueda ser editada. El único camino es un `addendum`.
- **Campos Obligatorios:** Al crear interfaces o esquemas para notas médicas, asegura la presencia de: Motivo de consulta, Padecimiento actual, Signos vitales, Exploración física, Diagnóstico (CIE-10) y Pronóstico.

## 🏥 Estándar HL7 FHIR R4
- **Mapeo de Recursos:** 
  - `Patient` -> Tabla `patients`.
  - `Encounter` -> Tabla `medical_notes`.
  - `Observation` -> Tabla `vitals`.
  - `MedicationRequest` -> Tabla `prescriptions`.
- **Validación:** Todas las respuestas bajo el path `/fhir` deben ser Bundles o Recursos válidos. Usa `shared/fhir-mappers` (si existe) para transformar datos internos a FHIR.

## 🔐 Seguridad y Privacidad
- **Cifrado en Reposo:** Garantiza que los campos sensibles identificados en `shared/schema.ts` (CURP, Teléfono, etc.) pasen por la función `encrypt()` de `server/crypto.ts` antes de cualquier `db.insert` o `db.update`.
- **Redacción de Logs:** Verifica que el middleware de logging en `server/index.ts` mantenga la redacción de campos sensibles para evitar filtraciones en los logs del VPS.

## 🔄 Workflows Especializados

### Auditoría de Nuevo Endpoint
1. Localizar la ruta en `server/routes.ts`.
2. Verificar si maneja datos sensibles (PII).
3. Confirmar que exista un `storage.createAuditLog` dentro del bloque `try/catch`.
4. Validar que la respuesta no incluya datos encriptados directamente (deben ser desencriptados solo para el cliente autorizado).

### Validación de Nota Médica
1. Revisar `shared/schema.ts` para asegurar que el tipo de nota esté soportado.
2. Confirmar que el flujo de firmado genere el hash SHA-256 usando el contenido canónico.
3. Asegurar que los diagnósticos se busquen en el catálogo CIE-10 y se guarden de forma relacional.
