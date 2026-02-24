/**
 * Sistema de Impresión de Documentos Médicos
 * Conforme a NOM-004-SSA3-2012, NOM-024-SSA3-2012 y COFEPRIS
 */

import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import type { 
  Patient, 
  MedicalNote, 
  Vitals, 
  Prescription, 
  LabOrder,
  PatientConsent,
  User 
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
  note: MedicalNote & { 
    medicoNombre?: string; 
    medicoEspecialidad?: string; 
    medicoCedula?: string;
    diagnosticos?: { codigo: string; descripcion: string; tipo: string }[];
  };
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
  order: LabOrder & { 
    patientNombre?: string; 
    patientApellido?: string;
    medicoNombre?: string;
    medicoCedula?: string;
    medicoEspecialidad?: string;
  };
  patient: Patient;
  diagnosticoCie10?: { codigo: string; descripcion: string }[];
  tipoEstudio?: 'laboratorio' | 'gabinete';
}

export function printLabGabinetOrder({ order, patient, diagnosticoCie10, tipoEstudio = 'laboratorio' }: LabOrderData): void {
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
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="establishment-info">
            <div class="establishment-name">Dr. ${order.medicoNombre || '_______________'}</div>
            <div class="doctor-credentials">
              ${order.medicoEspecialidad ? `<p>Especialidad: ${order.medicoEspecialidad}</p>` : ''}
              ${order.medicoCedula ? `<p>Cédula Profesional: ${order.medicoCedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
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
  patient: Patient;
  medico: Partial<User>;
}

export function printPrescriptionCOFEPRIS({ prescriptions, patient, medico }: PrescriptionData): void {
  const age = calculateAge(patient.fechaNacimiento);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Receta Médica - ${patient.nombre}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="establishment-info">
            <div class="establishment-name">Dr. ${medico.nombre || '_______________'}</div>
            <div class="doctor-credentials">
              ${medico.especialidad ? `<p>Especialidad: ${medico.especialidad}</p>` : ''}
              ${medico.cedula ? `<p>Cédula Profesional: ${medico.cedula}</p>` : ''}
            </div>
          </div>
          <div class="contact-info">
            <p>Fecha:</p>
            <p><strong>${formatDate(new Date())}</strong></p>
          </div>
        </div>
      </div>

      <div class="title-bar" style="background: #0369a1;">RECETA MÉDICA</div>

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
            <div class="field">
              <div class="field-label">Sexo</div>
              <div class="field-value">${patient.sexo === 'M' ? 'M' : 'F'}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field" style="flex: 2;">
              <div class="field-label">Domicilio</div>
              <div class="field-value">${patient.direccion || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section" style="min-height: 300px;">
        <div class="section-header">Prescripción</div>
        <div class="section-content">
          <div class="rx-symbol">Rp/</div>
          
          ${prescriptions.map((rx, i) => `
            <div class="medication-box">
              <div style="font-size: 13px; font-weight: bold; color: #0369a1; margin-bottom: 8px;">
                ${i + 1}. ${rx.medicamento}
              </div>
              <table style="font-size: 10px;">
                <tr>
                  <td style="width: 25%;"><strong>Presentación:</strong> ${rx.presentacion || '_________'}</td>
                  <td style="width: 25%;"><strong>Dosis:</strong> ${rx.dosis}</td>
                  <td style="width: 25%;"><strong>Vía:</strong> ${rx.via}</td>
                  <td style="width: 25%;"><strong>Cantidad:</strong> _________</td>
                </tr>
                <tr>
                  <td colspan="2"><strong>Frecuencia:</strong> ${rx.frecuencia}</td>
                  <td colspan="2"><strong>Duración:</strong> ${rx.duracion || '_________'}</td>
                </tr>
              </table>
              ${rx.indicaciones ? `
                <div style="margin-top: 8px; padding: 8px; background: #f0f9ff; border-left: 3px solid #0369a1; font-size: 10px;">
                  <strong>Indicaciones:</strong> ${rx.indicaciones}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            Firma Autógrafa del Médico<br>
            (Conforme a identificación oficial)
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            Sello del Consultorio
          </div>
        </div>
      </div>

      <div class="folio">
        <span>Folio: ${generateFolio('RX', prescriptions[0]?.id || Date.now().toString())}</span>
        <span>Hora: ${format(new Date(), 'HH:mm')} hrs</span>
      </div>

      <div class="legal-notice">
        <strong>AVISO IMPORTANTE:</strong> Esta receta es válida únicamente para los medicamentos aquí prescritos.
        La prescripción de medicamentos controlados requiere recetario especial autorizado por COFEPRIS.
        Conserve este documento como comprobante de su consulta médica.
      </div>

      <div class="footer">
        Receta elaborada conforme al Art. 240 de la Ley General de Salud y lineamientos de COFEPRIS
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  openPrintWindow(html, `Receta - ${patient.nombre}`);
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
