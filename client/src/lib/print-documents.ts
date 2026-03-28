/**
 * Sistema de Impresión de Documentos Médicos
 * Conforme a NOM-004-SSA3-2012, NOM-024-SSA3-2012 y COFEPRIS
 */

import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import {
  type Patient,
  type MedicalNote,
  type Vitals,
  type Prescription,
  type LabOrder,
  type PatientConsent,
  type User,
  type MedicalNoteWithDetails,
  type LabOrderWithDetails
} from "@shared/schema";

// =====================
// Estilos Base Compartidos
// =====================

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Arial, sans-serif; 
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    font-size: 11px;
    line-height: 1.4;
    color: #333;
  }
  .header {
    border: 2px solid #1a365d;
    padding: 15px;
    margin-bottom: 15px;
    background: linear-gradient(to bottom, #f8fafc, #fff);
  }
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .logo-area {
    width: 70px;
    height: 70px;
    border: 1px dashed #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #64748b;
    text-align: center;
    background: #fff;
  }
  .establishment-info {
    flex: 1;
    margin-left: 15px;
  }
  .establishment-name {
    font-size: 14px;
    font-weight: bold;
    color: #1a365d;
    margin-bottom: 2px;
  }
  .doctor-credentials {
    font-size: 10px;
    color: #475569;
    line-height: 1.5;
  }
  .contact-info {
    text-align: right;
    font-size: 10px;
    color: #475569;
  }
  .title-bar {
    background: #1a365d;
    color: white;
    text-align: center;
    padding: 8px 15px;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 15px;
  }
  .section {
    border: 1px solid #e2e8f0;
    margin-bottom: 12px;
    background: #fff;
  }
  .section-header {
    background: #f1f5f9;
    padding: 6px 12px;
    font-weight: bold;
    font-size: 11px;
    color: #1e40af;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-content {
    padding: 12px;
  }
  .field-row {
    display: flex;
    gap: 15px;
    margin-bottom: 8px;
  }
  .field-row:last-child { margin-bottom: 0; }
  .field {
    flex: 1;
  }
  .field-label {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .field-value {
    font-size: 11px;
    color: #1e293b;
    border-bottom: 1px solid #cbd5e1;
    min-height: 16px;
    padding: 2px 0;
  }
  .field-value.empty {
    color: #94a3b8;
    font-style: italic;
  }
  .signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    padding-top: 15px;
  }
  .signature-box {
    width: 45%;
    text-align: center;
  }
  .signature-line {
    border-top: 1px solid #1e293b;
    margin-top: 50px;
    padding-top: 5px;
    font-size: 10px;
    color: #475569;
  }
  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 9px;
    color: #64748b;
    text-align: center;
  }
  .folio {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #64748b;
    margin-top: 10px;
  }
  .legal-notice {
    background: #fef3c7;
    border: 1px solid #fbbf24;
    padding: 8px;
    font-size: 9px;
    color: #92400e;
    margin-top: 15px;
  }
  .alert-box {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    padding: 8px;
    margin-bottom: 10px;
    color: #991b1b;
    font-weight: 500;
  }
  .soap-section {
    margin-bottom: 10px;
  }
  .soap-label {
    font-weight: bold;
    color: #1e40af;
    font-size: 10px;
    margin-bottom: 3px;
  }
  .soap-content {
    padding: 8px;
    background: #f8fafc;
    border-left: 3px solid #3b82f6;
    font-size: 11px;
    min-height: 40px;
  }
  .diagnosis-item {
    display: flex;
    gap: 10px;
    padding: 5px 8px;
    background: #eff6ff;
    margin-bottom: 4px;
    border-radius: 3px;
  }
  .diagnosis-code {
    font-weight: bold;
    color: #1d4ed8;
    min-width: 80px;
  }
  .diagnosis-desc {
    color: #1e40af;
  }
  .study-item {
    padding: 8px;
    margin-bottom: 5px;
    background: #f0fdf4;
    border-left: 3px solid #22c55e;
  }
  .medication-box {
    border: 1px solid #e2e8f0;
    padding: 12px;
    margin-bottom: 10px;
    background: #fafafa;
  }
  .rx-symbol {
    font-size: 20px;
    font-weight: bold;
    color: #1a365d;
    margin-bottom: 10px;
  }
  .consent-text {
    text-align: justify;
    line-height: 1.6;
    font-size: 10px;
    margin-bottom: 15px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }
  th, td {
    border: 1px solid #e2e8f0;
    padding: 6px 8px;
    text-align: left;
  }
  th {
    background: #f1f5f9;
    font-weight: 600;
    color: #1e40af;
  }
  @media print {
    body { padding: 10px; }
    .no-print { display: none; }
    @page { margin: 1cm; }
  }
`;

// =====================
// Utilidades
// =====================

function calculateAge(fechaNacimiento: string | Date): number {
  return differenceInYears(new Date(), new Date(fechaNacimiento));
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), "d/MM/yyyy HH:mm", { locale: es });
}

function openPrintWindow(html: string, title: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para imprimir documentos.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function generateFolio(prefix: string, id: string): string {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

// =====================
// 1. HOJA DE IDENTIFICACIÓN DEL PACIENTE
// =====================

export interface PatientIdentificationData {
  patient: Patient;
  medico?: Partial<User>;
}

export function printPatientIdentification({ patient, medico }: PatientIdentificationData): void {
  const age = calculateAge(patient.fechaNacimiento);
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Hoja de Identificación - ${patient.nombre} ${patient.apellidoPaterno}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="establishment-info">
            <div class="establishment-name">${medico?.nombre || 'Nombre del Médico'}</div>
            <div class="doctor-credentials">
              ${medico?.especialidad ? `<p>Especialidad: ${medico.especialidad}</p>` : ''}
              ${medico?.cedula ? `<p>Cédula Profesional: ${medico.cedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
            <p>Fecha de impresión:</p>
            <p><strong>${formatDate(new Date())}</strong></p>
          </div>
        </div>
      </div>

      <div class="title-bar">HOJA DE IDENTIFICACIÓN DEL PACIENTE</div>

      ${patient.alergias && patient.alergias.length > 0 ? `
        <div class="alert-box">
          <strong>⚠️ ALERGIAS:</strong> ${patient.alergias.join(', ')}
        </div>
      ` : ''}

      <div class="section">
        <div class="section-header">Datos de Identificación</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field" style="flex: 2;">
              <div class="field-label">Número de Expediente</div>
              <div class="field-value"><strong>${patient.numeroExpediente}</strong></div>
            </div>
            <div class="field">
              <div class="field-label">CURP</div>
              <div class="field-value">${patient.curp}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Datos Personales</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field">
              <div class="field-label">Nombre(s)</div>
              <div class="field-value">${patient.nombre}</div>
            </div>
            <div class="field">
              <div class="field-label">Apellido Paterno</div>
              <div class="field-value">${patient.apellidoPaterno}</div>
            </div>
            <div class="field">
              <div class="field-label">Apellido Materno</div>
              <div class="field-value">${patient.apellidoMaterno || ''}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Fecha de Nacimiento</div>
              <div class="field-value">${formatDate(patient.fechaNacimiento)}</div>
            </div>
            <div class="field">
              <div class="field-label">Edad</div>
              <div class="field-value">${age} años</div>
            </div>
            <div class="field">
              <div class="field-label">Sexo</div>
              <div class="field-value">${patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
            </div>
            <div class="field">
              <div class="field-label">Grupo Sanguíneo</div>
              <div class="field-value">${patient.grupoSanguineo || 'No especificado'}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Lugar de Nacimiento</div>
              <div class="field-value">${patient.lugarNacimiento || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Estado Civil</div>
              <div class="field-value">${patient.estadoCivil || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Escolaridad</div>
              <div class="field-value">${patient.escolaridad || ''}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Ocupación</div>
              <div class="field-value">${patient.ocupacion || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Religión</div>
              <div class="field-value">${patient.religion || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Datos de Contacto</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field" style="flex: 2;">
              <div class="field-label">Dirección</div>
              <div class="field-value">${patient.direccion || ''}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Teléfono</div>
              <div class="field-value">${patient.telefono || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Correo Electrónico</div>
              <div class="field-value">${patient.email || ''}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Contacto de Emergencia</div>
              <div class="field-value">${patient.contactoEmergencia || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Teléfono de Emergencia</div>
              <div class="field-value">${patient.telefonoEmergencia || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="folio">
        <span>Folio: ${generateFolio('ID', patient.id)}</span>
        <span>Generado: ${formatDateTime(new Date())}</span>
      </div>

      <div class="footer">
        Documento generado conforme a la NOM-004-SSA3-2012 del Expediente Clínico
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  openPrintWindow(html, `Identificación - ${patient.nombre}`);
}

// =====================
// 2. HISTORIA CLÍNICA
// =====================

export interface ClinicalHistoryData {
  patient: Patient;
  medico?: Partial<User>;
  latestVitals?: Vitals | null;
}

export function printClinicalHistory({ patient, medico, latestVitals }: ClinicalHistoryData): void {
  const age = calculateAge(patient.fechaNacimiento);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Historia Clínica - ${patient.nombre} ${patient.apellidoPaterno}</title>
      <style>${baseStyles}
        .antecedentes-content {
          min-height: 60px;
          padding: 8px;
          background: #f8fafc;
          font-size: 10px;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="establishment-info">
            <div class="establishment-name">${medico?.nombre || 'Nombre del Médico'}</div>
            <div class="doctor-credentials">
              ${medico?.especialidad ? `<p>Especialidad: ${medico.especialidad}</p>` : ''}
              ${medico?.cedula ? `<p>Cédula Profesional: ${medico.cedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
            <p>Fecha:</p>
            <p><strong>${formatDate(new Date())}</strong></p>
          </div>
        </div>
      </div>

      <div class="title-bar">HISTORIA CLÍNICA</div>

      ${patient.alergias && patient.alergias.length > 0 ? `
        <div class="alert-box">
          <strong>⚠️ ALERGIAS:</strong> ${patient.alergias.join(', ')}
        </div>
      ` : ''}

      <div class="section">
        <div class="section-header">Ficha de Identificación</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field">
              <div class="field-label">Expediente</div>
              <div class="field-value"><strong>${patient.numeroExpediente}</strong></div>
            </div>
            <div class="field">
              <div class="field-label">Nombre Completo</div>
              <div class="field-value">${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Edad</div>
              <div class="field-value">${age} años</div>
            </div>
            <div class="field">
              <div class="field-label">Sexo</div>
              <div class="field-value">${patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
            </div>
            <div class="field">
              <div class="field-label">Grupo Sanguíneo</div>
              <div class="field-value">${patient.grupoSanguineo || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Ocupación</div>
              <div class="field-value">${patient.ocupacion || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Antecedentes Heredo-Familiares</div>
        <div class="section-content">
          <div class="antecedentes-content">${patient.antecedentesHeredoFamiliares || 'Sin datos registrados'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Antecedentes Personales Patológicos</div>
        <div class="section-content">
          <div class="antecedentes-content">${patient.antecedentesPersonalesPatologicos || 'Sin datos registrados'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Antecedentes Personales No Patológicos</div>
        <div class="section-content">
          <div class="antecedentes-content">${patient.antecedentesPersonalesNoPatologicos || 'Sin datos registrados'}</div>
        </div>
      </div>

      ${patient.sexo === 'F' ? `
      <div class="section">
        <div class="section-header">Antecedentes Gineco-Obstétricos</div>
        <div class="section-content">
          <div class="antecedentes-content">${patient.antecedentesGinecoObstetricos || 'Sin datos registrados'}</div>
        </div>
      </div>
      ` : ''}

      ${latestVitals ? `
      <div class="section">
        <div class="section-header">Signos Vitales (Último registro: ${formatDateTime(latestVitals.fecha)})</div>
        <div class="section-content">
          <table>
            <tr>
              <th>Presión Arterial</th>
              <th>FC</th>
              <th>FR</th>
              <th>Temp</th>
              <th>SpO2</th>
              <th>Peso</th>
              <th>Talla</th>
              <th>Glucosa</th>
            </tr>
            <tr>
              <td>${latestVitals.presionSistolica || '-'}/${latestVitals.presionDiastolica || '-'} mmHg</td>
              <td>${latestVitals.frecuenciaCardiaca || '-'} lpm</td>
              <td>${latestVitals.frecuenciaRespiratoria || '-'} rpm</td>
              <td>${latestVitals.temperatura || '-'} °C</td>
              <td>${latestVitals.saturacionOxigeno || '-'}%</td>
              <td>${latestVitals.peso || '-'} kg</td>
              <td>${latestVitals.talla || '-'} cm</td>
              <td>${latestVitals.glucosa || '-'} mg/dL</td>
            </tr>
          </table>
        </div>
      </div>
      ` : ''}

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            Firma del Médico<br>
            Cédula Profesional: ${medico?.cedula || '_____________'}
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            Sello del Consultorio
          </div>
        </div>
      </div>

      <div class="folio">
        <span>Folio: ${generateFolio('HC', patient.id)}</span>
        <span>Generado: ${formatDateTime(new Date())}</span>
      </div>

      <div class="footer">
        Historia Clínica elaborada conforme a la NOM-004-SSA3-2012 del Expediente Clínico
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  openPrintWindow(html, `Historia Clínica - ${patient.nombre}`);
}

// =====================
// 3. NOTA MÉDICA (SOAP + Pronóstico)
// =====================

export interface MedicalNoteData {
  note: MedicalNoteWithDetails;
  patient: Patient;
  vitals?: Vitals | null;
}

export function printMedicalNote({ note, patient, vitals }: MedicalNoteData): void {
  const age = calculateAge(patient.fechaNacimiento);
  
  const tipoLabels: Record<string, string> = {
    historia_clinica: 'Historia Clínica',
    nota_inicial: 'Nota de Primera Vez',
    nota_evolucion: 'Nota de Evolución',
    nota_interconsulta: 'Nota de Interconsulta',
    nota_referencia: 'Nota de Referencia',
    nota_ingreso: 'Nota de Ingreso',
    nota_preoperatoria: 'Nota Preoperatoria',
    nota_postoperatoria: 'Nota Postoperatoria',
    nota_preanestesica: 'Nota Preanestésica',
    nota_egreso: 'Nota de Egreso',
  };

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${tipoLabels[note.tipo] || 'Nota Médica'} - ${patient.nombre}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="establishment-info">
            <div class="establishment-name">Dr. ${note.medicoNombre || '_______________'}</div>
            <div class="doctor-credentials">
              ${note.medicoEspecialidad ? `<p>Especialidad: ${note.medicoEspecialidad}</p>` : ''}
              ${note.medicoCedula ? `<p>Cédula Profesional: ${note.medicoCedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
            <p>Fecha: <strong>${formatDate(note.fecha)}</strong></p>
            <p>Hora: <strong>${note.hora || format(new Date(note.fecha), 'HH:mm')}</strong></p>
          </div>
        </div>
      </div>

      <div class="title-bar">${tipoLabels[note.tipo] || 'NOTA MÉDICA'}</div>

      ${patient.alergias && patient.alergias.length > 0 ? `
        <div class="alert-box">
          <strong>⚠️ ALERGIAS:</strong> ${patient.alergias.join(', ')}
        </div>
      ` : ''}

      <div class="section">
        <div class="section-header">Datos del Paciente</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field">
              <div class="field-label">Nombre</div>
              <div class="field-value">${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Expediente</div>
              <div class="field-value">${patient.numeroExpediente}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Edad</div>
              <div class="field-value">${age} años</div>
            </div>
            <div class="field">
              <div class="field-label">Sexo</div>
              <div class="field-value">${patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
            </div>
            <div class="field">
              <div class="field-label">Grupo Sanguíneo</div>
              <div class="field-value">${patient.grupoSanguineo || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      ${note.motivoConsulta ? `
      <div class="section">
        <div class="section-header">Motivo de Consulta</div>
        <div class="section-content">
          <div style="font-size: 11px;">${note.motivoConsulta}</div>
        </div>
      </div>
      ` : ''}

      ${note.padecimientoActual ? `
      <div class="section">
        <div class="section-header">Padecimiento Actual</div>
        <div class="section-content">
          <div style="font-size: 11px; white-space: pre-wrap;">${note.padecimientoActual}</div>
        </div>
      </div>
      ` : ''}

      ${vitals ? `
      <div class="section">
        <div class="section-header">Signos Vitales</div>
        <div class="section-content">
          <table>
            <tr>
              <th>T/A</th>
              <th>FC</th>
              <th>FR</th>
              <th>Temp</th>
              <th>SpO2</th>
              <th>Peso</th>
              <th>Talla</th>
            </tr>
            <tr>
              <td>${vitals.presionSistolica || '-'}/${vitals.presionDiastolica || '-'} mmHg</td>
              <td>${vitals.frecuenciaCardiaca || '-'} lpm</td>
              <td>${vitals.frecuenciaRespiratoria || '-'} rpm</td>
              <td>${vitals.temperatura || '-'} °C</td>
              <td>${vitals.saturacionOxigeno || '-'}%</td>
              <td>${vitals.peso || '-'} kg</td>
              <td>${vitals.talla || '-'} cm</td>
            </tr>
          </table>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-header">Nota Clínica (Formato SOAP)</div>
        <div class="section-content">
          <div class="soap-section">
            <div class="soap-label">S - SUBJETIVO (Lo que refiere el paciente)</div>
            <div class="soap-content">${note.subjetivo || ''}</div>
          </div>
          <div class="soap-section">
            <div class="soap-label">O - OBJETIVO (Hallazgos a la exploración)</div>
            <div class="soap-content">${note.objetivo || ''}</div>
          </div>
          <div class="soap-section">
            <div class="soap-label">A - ANÁLISIS (Diagnósticos)</div>
            <div class="soap-content">${note.analisis || ''}</div>
          </div>
          <div class="soap-section">
            <div class="soap-label">P - PLAN (Tratamiento e indicaciones)</div>
            <div class="soap-content">${note.plan || ''}</div>
          </div>
        </div>
      </div>

      ${note.diagnosticos && note.diagnosticos.length > 0 ? `
      <div class="section">
        <div class="section-header">Diagnósticos</div>
        <div class="section-content">
          ${note.diagnosticos.map((dx) => `
            <div class="diagnosis-item">
              <span class="diagnosis-code">${dx.codigo}</span>
              <span class="diagnosis-desc">${dx.descripcion}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-header">Pronóstico</div>
        <div class="section-content">
          <div style="min-height: 30px; font-size: 11px;">${note.pronostico || 'Reservado a evolución'}</div>
        </div>
      </div>

      ${note.indicacionTerapeutica ? `
      <div class="section">
        <div class="section-header">Indicación Terapéutica</div>
        <div class="section-content">
          <div style="font-size: 11px; white-space: pre-wrap;">${note.indicacionTerapeutica}</div>
        </div>
      </div>
      ` : ''}

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            Firma del Médico<br>
            Dr. ${note.medicoNombre || '_______________'}<br>
            Cédula: ${note.medicoCedula || '_______________'}
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            Sello del Consultorio
          </div>
        </div>
      </div>

      ${note.firmada ? `
      <div style="background: #dcfce7; border: 1px solid #22c55e; padding: 8px; margin-top: 15px; font-size: 10px; color: #166534;">
        <strong>✓ NOTA FIRMADA ELECTRÓNICAMENTE</strong><br>
        Fecha de firma: ${formatDateTime(note.fechaFirma)}<br>
        Hash: ${note.firmaHash?.slice(0, 32)}...
      </div>
      ` : ''}

      <div class="folio">
        <span>Folio: ${generateFolio('NM', note.id)}</span>
        <span>Generado: ${formatDateTime(new Date())}</span>
      </div>

      <div class="footer">
        Nota médica elaborada conforme a la NOM-004-SSA3-2012 del Expediente Clínico
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  openPrintWindow(html, `Nota Médica - ${patient.nombre}`);
}

// =====================
// 4. SOLICITUD DE LABORATORIO/GABINETE
// =====================

export interface LabOrderData {
  order: LabOrderWithDetails;
  patient: Patient;
  diagnosticoCie10?: { codigo: string; descripcion: string }[];
  tipoEstudio?: 'laboratorio' | 'gabinete';
  establishment?: Partial<import("@shared/schema").EstablishmentConfig> | null;
}

export function printLabGabinetOrder({ order, patient, diagnosticoCie10, tipoEstudio = 'laboratorio', establishment }: LabOrderData): void {
  const age = calculateAge(patient.fechaNacimiento);
  const isGabinete = tipoEstudio === 'gabinete';
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de ${isGabinete ? 'Gabinete' : 'Laboratorio'} - ${patient.nombre}</title>
      <style>${baseStyles}
        .urgent-banner {
          background: #dc2626;
          color: white;
          text-align: center;
          padding: 8px;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          ${establishment?.logoUrl
            ? `<img src="${establishment.logoUrl}" alt="Logo" style="width:80px;height:80px;object-fit:contain;">`
            : `<div class="logo-area">Logo del<br>Consultorio</div>`}
          <div class="establishment-info">
            <div class="establishment-name">${establishment?.nombreEstablecimiento || `Dr. ${order.medicoNombre || '_______________'}`}</div>
            <div class="doctor-credentials">
              <p>Dr. ${order.medicoNombre || '_______________'}</p>
              ${order.medicoEspecialidad ? `<p>Especialidad: ${order.medicoEspecialidad}</p>` : ''}
              ${order.medicoCedula ? `<p>Cédula Profesional: ${order.medicoCedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
            ${establishment?.domicilio ? `<p>${establishment.domicilio}</p>` : ''}
            ${establishment?.ciudad ? `<p>${establishment.ciudad}${establishment.estado ? `, ${establishment.estado}` : ''}</p>` : ''}
            ${establishment?.telefono ? `<p>Tel: ${establishment.telefono}</p>` : ''}
            <p>Fecha: <strong>${formatDate(order.createdAt)}</strong></p>
          </div>
        </div>
      </div>

      <div class="title-bar" style="background: ${isGabinete ? '#7c3aed' : '#059669'}">
        SOLICITUD DE ${isGabinete ? 'ESTUDIOS DE GABINETE' : 'ESTUDIOS DE LABORATORIO'}
      </div>

      ${order.urgente ? '<div class="urgent-banner">⚠️ URGENTE</div>' : ''}

      <div class="section">
        <div class="section-header">Datos del Paciente</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field" style="flex: 2;">
              <div class="field-label">Nombre Completo</div>
              <div class="field-value">${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Expediente</div>
              <div class="field-value">${patient.numeroExpediente}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">Edad</div>
              <div class="field-value">${age} años</div>
            </div>
            <div class="field">
              <div class="field-label">Sexo</div>
              <div class="field-value">${patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
            </div>
            <div class="field">
              <div class="field-label">CURP</div>
              <div class="field-value">${patient.curp}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Diagnóstico(s) - CIE-10</div>
        <div class="section-content">
          ${diagnosticoCie10 && diagnosticoCie10.length > 0 ? 
            diagnosticoCie10.map(dx => `
              <div class="diagnosis-item">
                <span class="diagnosis-code">${dx.codigo}</span>
                <span class="diagnosis-desc">${dx.descripcion}</span>
              </div>
            `).join('') : `
            <div class="diagnosis-item">
              <span class="diagnosis-desc">${order.diagnosticoPresuntivo || 'No especificado'}</span>
            </div>
          `}
        </div>
      </div>

      <div class="section">
        <div class="section-header">Estudios Solicitados</div>
        <div class="section-content">
          ${order.estudios.map((estudio, i) => `
            <div class="study-item">
              <strong>${i + 1}.</strong> ${estudio}
            </div>
          `).join('')}
        </div>
      </div>

      ${order.indicacionesClinicas ? `
      <div class="section">
        <div class="section-header">Indicaciones Clínicas</div>
        <div class="section-content">
          <div style="font-size: 11px;">${order.indicacionesClinicas}</div>
        </div>
      </div>
      ` : ''}

      <div class="legal-notice">
        <strong>INDICACIONES PARA EL PACIENTE:</strong><br>
        ${order.ayuno ? '• Presentarse en AYUNO de 8 a 12 horas.<br>' : ''}
        • Presentar esta solicitud en el ${isGabinete ? 'gabinete de imagenología' : 'laboratorio'} de su preferencia.<br>
        • Los resultados deben ser entregados al médico tratante para su interpretación.<br>
        ${order.urgente ? '• <strong>ESTUDIO URGENTE - Priorizar atención.</strong>' : ''}
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            Firma del Médico Solicitante<br>
            Cédula: ${order.medicoCedula || '_______________'}
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            Sello del Consultorio
          </div>
        </div>
      </div>

      <div class="folio">
        <span>Folio: ${generateFolio(isGabinete ? 'GAB' : 'LAB', order.id)}</span>
        <span>Hora: ${format(new Date(), 'HH:mm')} hrs</span>
      </div>

      <div class="footer">
        Solicitud elaborada conforme a la NOM-004-SSA3-2012 del Expediente Clínico
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  openPrintWindow(html, `Orden ${isGabinete ? 'Gabinete' : 'Lab'} - ${patient.nombre}`);
}

// =====================
// 5. RECETA MÉDICA (COFEPRIS)
// =====================

export interface PrescriptionData {
  prescriptions: Prescription[];
  instruccionesGenerales?: string;
  patient: Patient;
  medico: Partial<User>;
  establishment?: Partial<import("@shared/schema").EstablishmentConfig> | null;
}

export function printPrescriptionCOFEPRIS({ prescriptions, instruccionesGenerales, patient, medico, establishment }: PrescriptionData): void {
  const age = calculateAge(patient.fechaNacimiento);
  const folio = generateFolio('RX', prescriptions[0]?.id || Date.now().toString());
  const fecha = formatDate(new Date());
  const hora = format(new Date(), 'HH:mm');

  const clinicName = establishment?.nombreEstablecimiento || `Consultorio Médico`;
  const clinicAddress = [establishment?.domicilio, establishment?.ciudad, establishment?.estado]
    .filter(Boolean).join(', ');
  const clinicPhone = establishment?.telefono || '';
  const clinicLicense = establishment?.licenciaSanitaria || '';
  const clinicLogo = establishment?.logoUrl || '';
  const clinicRfc = establishment?.rfc || '';

  const doctorTitle = `Dr${medico.nombre?.toLowerCase().startsWith('dra') ? 'a' : ''}. ${medico.nombre || '_______________'}`;

  const prescriptionStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 24px 28px;
      max-width: 820px;
      margin: 0 auto;
      font-size: 11px;
      line-height: 1.45;
      color: #1e293b;
      background: #fff;
    }

    /* ── HEADER ── */
    .rx-header {
      display: flex;
      align-items: stretch;
      border: 2px solid #1e3a5f;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0;
    }
    .rx-header-logo {
      width: 88px;
      min-height: 88px;
      background: #f0f4f8;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 2px solid #1e3a5f;
      flex-shrink: 0;
    }
    .rx-header-logo img {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
    }
    .rx-header-logo-placeholder {
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
      padding: 8px;
    }
    .rx-header-clinic {
      flex: 1;
      padding: 10px 14px;
    }
    .rx-clinic-name {
      font-size: 15px;
      font-weight: 700;
      color: #1e3a5f;
      letter-spacing: 0.3px;
      margin-bottom: 3px;
    }
    .rx-doctor-name {
      font-size: 12px;
      font-weight: 600;
      color: #0f5278;
      margin-bottom: 2px;
    }
    .rx-credentials {
      font-size: 10px;
      color: #475569;
      line-height: 1.55;
    }
    .rx-header-right {
      padding: 10px 14px;
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 160px;
      border-left: 1px solid #c8d7e8;
    }
    .rx-folio {
      font-size: 9px;
      color: #64748b;
    }
    .rx-folio strong { color: #1e3a5f; font-size: 10px; }
    .rx-date { font-size: 10px; color: #1e293b; }
    .rx-date strong { display: block; font-size: 12px; color: #1e3a5f; }

    /* ── TITLE BAR ── */
    .rx-title-bar {
      background: linear-gradient(90deg, #1e3a5f 0%, #0369a1 100%);
      color: #fff;
      text-align: center;
      padding: 7px 16px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 14px;
      border-radius: 0 0 3px 3px;
    }

    /* ── SECTIONS ── */
    .rx-section {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .rx-section-title {
      background: #e8f0f9;
      padding: 5px 12px;
      font-weight: 700;
      font-size: 10px;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #cbd5e1;
    }
    .rx-section-body { padding: 10px 12px; }

    /* ── PATIENT ROW ── */
    .rx-patient-grid {
      display: grid;
      grid-template-columns: 2fr 80px 60px 1fr;
      gap: 12px;
      margin-bottom: 6px;
    }
    .rx-patient-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .rx-field-label {
      font-size: 8.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .rx-field-value {
      font-size: 11.5px;
      color: #0f172a;
      border-bottom: 1px solid #94a3b8;
      min-height: 18px;
      padding-bottom: 1px;
      font-weight: 500;
    }

    /* ── RX SYMBOL ── */
    .rx-symbol {
      font-size: 26px;
      font-weight: 900;
      color: #1e3a5f;
      font-family: 'Times New Roman', serif;
      line-height: 1;
      margin-bottom: 10px;
    }

    /* ── MEDICATION CARDS ── */
    .med-card {
      border: 1px solid #bfdbfe;
      border-left: 4px solid #1e3a5f;
      border-radius: 4px;
      padding: 10px 12px;
      margin-bottom: 10px;
      background: #f8fbff;
    }
    .med-card:last-child { margin-bottom: 0; }
    .med-card-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
    }
    .med-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: #1e3a5f;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .med-name {
      font-size: 13px;
      font-weight: 700;
      color: #0c1f3d;
    }
    .med-presentation {
      font-size: 11px;
      color: #475569;
      font-style: italic;
    }
    .med-details {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 6px;
      background: #fff;
      border: 1px solid #dbeafe;
      border-radius: 3px;
      padding: 7px 10px;
    }
    .med-detail-item {}
    .med-detail-label {
      font-size: 8.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .med-detail-value {
      font-size: 11px;
      color: #1e293b;
      font-weight: 600;
    }
    .med-indicaciones {
      margin-top: 6px;
      padding: 6px 9px;
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      font-size: 10px;
      color: #1e40af;
      border-radius: 0 3px 3px 0;
    }
    .med-indicaciones strong { color: #1d4ed8; }

    /* ── INSTRUCCIONES GENERALES ── */
    .rx-instructions {
      background: #fefce8;
      border: 1px solid #fde047;
      border-left: 4px solid #ca8a04;
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 11px;
      color: #713f12;
      line-height: 1.6;
    }
    .rx-instructions-title {
      font-weight: 700;
      color: #92400e;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    /* ── SIGNATURES ── */
    .rx-signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 32px;
      padding-top: 0;
    }
    .rx-sig-box {
      text-align: center;
      width: 42%;
    }
    .rx-sig-line {
      border-top: 1.5px solid #1e3a5f;
      padding-top: 6px;
      font-size: 10px;
      color: #475569;
      line-height: 1.5;
    }
    .rx-sig-space { height: 56px; }

    /* ── FOOTER ── */
    .rx-meta {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .rx-legal {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 3px;
      padding: 7px 10px;
      font-size: 9px;
      color: #78350f;
      margin-top: 10px;
      line-height: 1.55;
    }
    .rx-footer {
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #f1f5f9;
    }

    @media print {
      body { padding: 8px 12px; }
      .no-print { display: none !important; }
      @page { margin: 1.2cm 1cm; size: letter portrait; }
    }
  `;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica — ${patient.nombre} ${patient.apellidoPaterno}</title>
  <style>${prescriptionStyles}</style>
</head>
<body>

  <!-- HEADER -->
  <div class="rx-header">
    <div class="rx-header-logo">
      ${clinicLogo
        ? `<img src="${clinicLogo}" alt="Logo" />`
        : `<div class="rx-header-logo-placeholder">Logo<br>Consultorio</div>`
      }
    </div>
    <div class="rx-header-clinic">
      <div class="rx-clinic-name">${clinicName}</div>
      <div class="rx-doctor-name">${doctorTitle}</div>
      <div class="rx-credentials">
        ${medico.especialidad ? `Especialidad: <strong>${medico.especialidad}</strong><br>` : ''}
        ${medico.cedula ? `Cédula Med. General: <strong>${medico.cedula}</strong><br>` : ''}
        ${(medico as any).cedulaEspecialidad ? `Cédula Especialidad: <strong>${(medico as any).cedulaEspecialidad}</strong><br>` : ''}
        ${(medico as any).universidad ? `Universidad: ${(medico as any).universidad}<br>` : ''}
        ${clinicAddress ? `${clinicAddress}<br>` : ''}
        ${clinicPhone ? `Tel: ${clinicPhone}` : ''}
        ${clinicRfc ? `&nbsp;&nbsp;RFC: ${clinicRfc}` : ''}
        ${clinicLicense ? `<br>Lic. Sanitaria: <strong>${clinicLicense}</strong>` : ''}
      </div>
    </div>
    ${(medico as any).logoUniversidadUrl ? `
    <div style="width:72px;min-height:88px;background:#f0f4f8;display:flex;align-items:center;justify-content:center;border-left:2px solid #1e3a5f;flex-shrink:0;padding:4px;">
      <img src="${(medico as any).logoUniversidadUrl}" alt="Escudo universidad" style="max-width:64px;max-height:80px;object-fit:contain;" />
    </div>` : ''}
    <div class="rx-header-right">
      <div class="rx-folio">
        Folio<br><strong>${folio}</strong>
      </div>
      <div class="rx-date">
        Fecha de expedición<br>
        <strong>${fecha}</strong>
        <div style="font-size:9px;color:#64748b;margin-top:2px">${hora} hrs</div>
      </div>
    </div>
  </div>

  <div class="rx-title-bar">Receta Médica</div>

  <!-- DATOS DEL PACIENTE -->
  <div class="rx-section">
    <div class="rx-section-title">Datos del Paciente</div>
    <div class="rx-section-body">
      <div class="rx-patient-grid">
        <div>
          <div class="rx-field-label">Nombre completo</div>
          <div class="rx-field-value">${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}</div>
        </div>
        <div>
          <div class="rx-field-label">Edad</div>
          <div class="rx-field-value">${age} años</div>
        </div>
        <div>
          <div class="rx-field-label">Sexo</div>
          <div class="rx-field-value">${patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
        </div>
        <div>
          <div class="rx-field-label">Fecha de nacimiento</div>
          <div class="rx-field-value">${patient.fechaNacimiento ? formatDate(new Date(patient.fechaNacimiento)) : '—'}</div>
        </div>
      </div>
      <div class="rx-patient-grid-2">
        <div>
          <div class="rx-field-label">Domicilio</div>
          <div class="rx-field-value">${patient.direccion || '—'}</div>
        </div>
        <div>
          <div class="rx-field-label">Alergias conocidas</div>
          <div class="rx-field-value" style="color:${patient.alergias?.length ? '#b91c1c' : '#94a3b8'}">${patient.alergias?.length ? patient.alergias.join(', ') : 'Sin alergias registradas'}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- PRESCRIPCIÓN -->
  <div class="rx-section">
    <div class="rx-section-title">Prescripción Médica</div>
    <div class="rx-section-body">
      <div class="rx-symbol">&#x211E;</div>

      ${prescriptions.map((rx, i) => `
        <div class="med-card">
          <div class="med-card-header">
            <span class="med-number">${i + 1}</span>
            <span class="med-name">${rx.medicamento}</span>
            ${rx.presentacion ? `<span class="med-presentation">— ${rx.presentacion}</span>` : ''}
          </div>
          <div class="med-details">
            <div class="med-detail-item">
              <div class="med-detail-label">Dosis</div>
              <div class="med-detail-value">${rx.dosis}</div>
            </div>
            <div class="med-detail-item">
              <div class="med-detail-label">Vía</div>
              <div class="med-detail-value">${rx.via}</div>
            </div>
            <div class="med-detail-item">
              <div class="med-detail-label">Frecuencia</div>
              <div class="med-detail-value">${rx.frecuencia}</div>
            </div>
            <div class="med-detail-item">
              <div class="med-detail-label">Duración</div>
              <div class="med-detail-value">${rx.duracion || '—'}</div>
            </div>
          </div>
          ${rx.indicaciones ? `
            <div class="med-indicaciones">
              <strong>Indicaciones:</strong> ${rx.indicaciones}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>

  ${instruccionesGenerales ? `
  <!-- INSTRUCCIONES GENERALES -->
  <div class="rx-section">
    <div class="rx-section-title">Instrucciones Médicas Generales</div>
    <div class="rx-section-body">
      <div class="rx-instructions">
        <div class="rx-instructions-title">Indicaciones para el paciente</div>
        ${instruccionesGenerales}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- FIRMAS -->
  <div class="rx-signatures">
    <div class="rx-sig-box">
      <div class="rx-sig-space"></div>
      <div class="rx-sig-line">
        <strong>Firma Autógrafa del Médico</strong><br>
        ${doctorTitle}<br>
        ${medico.cedula ? `Céd. Med. General: ${medico.cedula}` : ''}
        ${(medico as any).cedulaEspecialidad ? `<br>Céd. Especialidad: ${(medico as any).cedulaEspecialidad}` : ''}
      </div>
    </div>
    <div class="rx-sig-box">
      <div class="rx-sig-space"></div>
      <div class="rx-sig-line">
        <strong>Sello del Consultorio</strong><br>
        ${clinicName}
      </div>
    </div>
  </div>

  <!-- META -->
  <div class="rx-meta">
    <span>Folio: ${folio} &nbsp;|&nbsp; ${fecha} — ${hora} hrs</span>
    <span>${prescriptions.length} medicamento${prescriptions.length !== 1 ? 's' : ''} prescritos</span>
  </div>

  <div class="rx-legal">
    <strong>AVISO COFEPRIS:</strong> Esta receta es válida únicamente para los medicamentos aquí prescritos y en las dosis indicadas.
    La prescripción de medicamentos controlados requiere recetario especial autorizado por COFEPRIS (Art. 28 de la NOM-072-SSA1-2012).
    Conserve este documento como comprobante de su consulta médica. Receta expedida conforme al Art. 240 de la Ley General de Salud.
  </div>

  <div class="rx-footer">
    Sistema de Gestión de Salud Digital &nbsp;|&nbsp; NOM-004-SSA3-2012 &nbsp;|&nbsp; NOM-024-SSA3-2012 &nbsp;|&nbsp; COFEPRIS
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  openPrintWindow(html, `Receta — ${patient.nombre} ${patient.apellidoPaterno}`);
}

// =====================
// 6. CONSENTIMIENTO INFORMADO
// =====================

export interface ConsentData {
  consent: PatientConsent;
  patient: Patient;
  medico?: Partial<User>;
}

const consentTexts: Record<string, { titulo: string; contenido: string }> = {
  privacidad: {
    titulo: 'AVISO DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES',
    contenido: `En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), le informamos que sus datos personales y datos sensibles (información de salud) serán tratados de manera confidencial y con las medidas de seguridad administrativas, técnicas y físicas necesarias para proteger su información.

FINALIDADES DEL TRATAMIENTO:
• Prestación de servicios médicos y de salud
• Elaboración y resguardo del expediente clínico
• Facturación y cobranza
• Cumplimiento de obligaciones legales

Sus datos no serán transferidos a terceros sin su consentimiento, salvo las excepciones previstas en la Ley. Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (Derechos ARCO) al tratamiento de sus datos personales.`
  },
  atencion_consulta: {
    titulo: 'CONSENTIMIENTO INFORMADO PARA ATENCIÓN EN CONSULTA',
    contenido: `Por medio del presente documento, manifiesto que he sido informado(a) de manera clara y comprensible sobre:

1. La naturaleza de la consulta médica y los procedimientos diagnósticos que pueden realizarse.
2. Los beneficios esperados del tratamiento propuesto.
3. Los riesgos inherentes a cualquier procedimiento médico.
4. Las alternativas de tratamiento disponibles.
5. Mi derecho a solicitar una segunda opinión médica.
6. Mi derecho a retirar este consentimiento en cualquier momento.

Declaro que he tenido la oportunidad de hacer preguntas y que éstas han sido respondidas satisfactoriamente. Entiendo que la medicina no es una ciencia exacta y que no se me han dado garantías sobre los resultados del tratamiento.`
  },
  procedimiento: {
    titulo: 'CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTO',
    contenido: `Autorizo al médico tratante y a su equipo a realizar el procedimiento descrito en este documento, habiendo sido informado(a) sobre:

1. DESCRIPCIÓN DEL PROCEDIMIENTO: Se me ha explicado en qué consiste el procedimiento, su técnica y duración aproximada.

2. BENEFICIOS: Comprendo los beneficios esperados del procedimiento.

3. RIESGOS: Se me han explicado los riesgos generales (infección, sangrado, dolor, reacciones adversas) y específicos del procedimiento.

4. ALTERNATIVAS: Conozco las alternativas de tratamiento, incluyendo la opción de no realizar el procedimiento.

5. CONTINGENCIAS: Autorizo que se realicen los procedimientos adicionales que sean necesarios durante la intervención para salvaguardar mi vida o integridad física.

Declaro que la información proporcionada es verídica y que he comprendido toda la información recibida.`
  },
  expediente_electronico: {
    titulo: 'CONSENTIMIENTO PARA EXPEDIENTE CLÍNICO ELECTRÓNICO',
    contenido: `Autorizo la creación, almacenamiento y consulta de mi Expediente Clínico Electrónico (ECE) conforme a la NOM-024-SSA3-2012, entendiendo que:

1. Mi expediente será resguardado con medidas de seguridad técnicas y administrativas.
2. Solo personal autorizado tendrá acceso a mi información médica.
3. Se mantendrá un registro de auditoría de todos los accesos a mi expediente.
4. Puedo solicitar copia de mi expediente en cualquier momento.
5. La información se conservará por el tiempo establecido en la normatividad vigente (mínimo 5 años).`
  }
};

export function printConsent({ consent, patient, medico }: ConsentData): void {
  const age = calculateAge(patient.fechaNacimiento);
  const consentConfig = consentTexts[consent.tipoConsentimiento] || {
    titulo: 'CONSENTIMIENTO INFORMADO',
    contenido: consent.procedimiento || ''
  };

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Consentimiento - ${patient.nombre}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="establishment-info">
            <div class="establishment-name">${medico?.nombre || 'Nombre del Médico'}</div>
            <div class="doctor-credentials">
              ${medico?.especialidad ? `<p>Especialidad: ${medico.especialidad}</p>` : ''}
              ${medico?.cedula ? `<p>Cédula: ${medico.cedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
            <p>Fecha:</p>
            <p><strong>${formatDate(new Date())}</strong></p>
          </div>
        </div>
      </div>

      <div class="title-bar" style="background: #7c2d12;">${consentConfig.titulo}</div>

      <div class="section">
        <div class="section-header">Datos del Paciente</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field" style="flex: 2;">
              <div class="field-label">Nombre Completo</div>
              <div class="field-value">${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Edad</div>
              <div class="field-value">${age} años</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <div class="field-label">CURP</div>
              <div class="field-value">${patient.curp}</div>
            </div>
            <div class="field">
              <div class="field-label">Expediente</div>
              <div class="field-value">${patient.numeroExpediente}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-content">
          <div class="consent-text" style="white-space: pre-wrap;">
${consentConfig.contenido}
          </div>

          ${consent.procedimiento && consent.tipoConsentimiento === 'procedimiento' ? `
          <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border: 1px solid #fbbf24;">
            <strong>PROCEDIMIENTO ESPECÍFICO:</strong><br>
            ${consent.procedimiento}
          </div>
          ` : ''}

          ${consent.riesgos ? `
          <div style="margin-top: 10px;">
            <strong>RIESGOS ESPECÍFICOS:</strong><br>
            ${consent.riesgos}
          </div>
          ` : ''}

          ${consent.beneficios ? `
          <div style="margin-top: 10px;">
            <strong>BENEFICIOS ESPERADOS:</strong><br>
            ${consent.beneficios}
          </div>
          ` : ''}

          ${consent.alternativas ? `
          <div style="margin-top: 10px;">
            <strong>ALTERNATIVAS DE TRATAMIENTO:</strong><br>
            ${consent.alternativas}
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-header">Declaración de Consentimiento</div>
        <div class="section-content">
          <p style="font-size: 10px; margin-bottom: 15px;">
            Declaro que he leído y comprendido la información contenida en este documento, que he tenido la 
            oportunidad de hacer preguntas y que éstas han sido respondidas satisfactoriamente. 
            <strong>OTORGO MI CONSENTIMIENTO</strong> de manera libre, voluntaria e informada.
          </p>

          <div class="field-row">
            <div class="field">
              <div class="field-label">Nombre del Paciente o Representante Legal</div>
              <div class="field-value">${consent.nombreFirmante || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Parentesco (si es representante)</div>
              <div class="field-value">${consent.parentescoRepresentante || ''}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <div class="field-label">Lugar de Firma</div>
              <div class="field-value">${consent.lugarFirma || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Fecha y Hora</div>
              <div class="field-value">${formatDateTime(consent.fechaAceptacion || new Date())}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="signature-section" style="margin-top: 20px;">
        <div class="signature-box">
          <div class="signature-line">
            Firma del Paciente o Representante Legal
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            Firma del Médico<br>
            Cédula: ${medico?.cedula || '_______________'}
          </div>
        </div>
      </div>

      <div class="section" style="margin-top: 20px;">
        <div class="section-header">Testigos (NOM-004-SSA3-2012)</div>
        <div class="section-content">
          <div class="field-row">
            <div class="field">
              <div class="field-label">Testigo 1 - Nombre</div>
              <div class="field-value">${consent.nombreTestigo1 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Testigo 2 - Nombre</div>
              <div class="field-value">${consent.nombreTestigo2 || ''}</div>
            </div>
          </div>
          <div class="signature-section" style="margin-top: 10px;">
            <div class="signature-box">
              <div class="signature-line">Firma Testigo 1</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Firma Testigo 2</div>
            </div>
          </div>
        </div>
      </div>

      <div class="folio">
        <span>Folio: ${generateFolio('CI', consent.id)}</span>
        <span>Versión: ${consent.version}</span>
      </div>

      <div class="footer">
        Consentimiento informado conforme a la NOM-004-SSA3-2012 y LFPDPPP
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  openPrintWindow(html, `Consentimiento - ${patient.nombre}`);
}

// =====================
// EXPORTACIÓN PRINCIPAL
// =====================

export const PrintDocuments = {
  patientIdentification: printPatientIdentification,
  clinicalHistory: printClinicalHistory,
  medicalNote: printMedicalNote,
  labGabinetOrder: printLabGabinetOrder,
  prescription: printPrescriptionCOFEPRIS,
  consent: printConsent,
};

export default PrintDocuments;
