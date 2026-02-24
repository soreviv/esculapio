# GEMINI.md - Mandatos del Proyecto Salud Digital

Este archivo establece las directrices operativas y técnicas para Gemini CLI dentro de este workspace. Estas instrucciones tienen precedencia sobre los flujos de trabajo generales.

## 🩺 Contexto del Proyecto
Salud Digital es un sistema de Expediente Clínico Electrónico (ECE) de misión crítica que debe cumplir con las normas mexicanas **NOM-024-SSA3-2012** y **NOM-004-SSA3-2012**. La integridad de los datos y la trazabilidad son innegociables.

## 🚨 Invariantes Críticas (No Negociables)
1. **Bitácora de Auditoría:** Nunca implementes un endpoint que cree, modifique o consulte datos sensibles sin añadir su correspondiente registro en la tabla `audit_logs`.
2. **Inmutabilidad:** Las notas médicas marcadas como `firmada: true` no deben ser editables bajo ninguna circunstancia. Cualquier cambio posterior debe hacerse vía `medical_note_addendums` (Anexos).
3. **Privacidad de Datos:** Los datos sensibles del paciente (CURP, teléfono, dirección, email) deben ser encriptados usando las utilidades en `server/crypto.ts` antes de persistirse.
4. **Validación de Identidad:** Todas las acciones de firma deben verificar que el `medicoId` de la nota coincida con el `userId` de la sesión.

## 🛠️ Estándares Técnicos
- **Base de Datos:** Uso estricto de **PostgreSQL** con **Drizzle ORM**. Las llaves primarias deben ser **UUID** nativos.
- **Validación:** Uso de **Zod** para validación de esquemas tanto en el servidor como en el cliente (compartidos en `shared/schema.ts`).
- **Nomenclatura:** 
  - Términos de dominio y visuales en **Español** (pacientes, diagnósticos, citas).
  - Identificadores de código, variables y funciones en **Inglés**.
- **Arquitectura:** Patrón **Repository** en `server/storage.ts` para desacoplar la lógica de negocio de la base de datos.

## 🧪 Flujo de Trabajo para Gemini CLI
1. **Investigación:** Antes de proponer un cambio, verifica los impactos en el esquema de Drizzle y las dependencias en `routes.ts`.
2. **Reproducción:** Para errores de seguridad o validación, intenta crear un test en la carpeta `tests/` que demuestre el fallo antes de aplicar la corrección.
3. **Validación:** Tras cada cambio en el backend, verifica que el tipado de TypeScript (`npm run check`) siga siendo válido, ya que el esquema es compartido.

## 🛡️ Seguridad
- El administrador es el único rol con acceso a la verificación de integridad de hashes y logs de auditoría completos.
- Nunca expongas la `ENCRYPTION_KEY` o el `SESSION_SECRET` en logs o respuestas de error.

---
*Este documento es la fuente de verdad para el comportamiento del agente en este repositorio.*
