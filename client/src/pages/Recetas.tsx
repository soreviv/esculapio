import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, Calendar, User, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PrescriptionWithDetails } from "@shared/schema";
import { NewPrescriptionDialog } from "@/components/ehr/NewPrescriptionDialog";

function printPrescription(prescription: PrescriptionWithDetails) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const fechaEmision = prescription.createdAt 
    ? format(new Date(prescription.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Receta Médica - COFEPRIS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 25px;
          max-width: 800px;
          margin: 0 auto;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          border: 2px solid #000;
          padding: 15px;
          margin-bottom: 15px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .logo-area {
          width: 80px;
          height: 80px;
          border: 1px dashed #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        .doctor-info {
          flex: 1;
          margin-left: 15px;
        }
        .doctor-name {
          font-size: 16px;
          font-weight: bold;
          color: #000;
          margin-bottom: 3px;
        }
        .doctor-specialty {
          font-size: 12px;
          color: #333;
          margin-bottom: 8px;
        }
        .credentials {
          font-size: 11px;
          color: #333;
        }
        .credentials strong {
          color: #000;
        }
        .contact-info {
          text-align: right;
          font-size: 11px;
        }
        .contact-info p {
          margin-bottom: 2px;
        }
        .title-bar {
          background: #1a5f7a;
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        .patient-section {
          border: 1px solid #ccc;
          padding: 12px;
          margin-bottom: 15px;
          background: #fafafa;
        }
        .patient-row {
          display: flex;
          gap: 20px;
          margin-bottom: 8px;
        }
        .patient-row:last-child {
          margin-bottom: 0;
        }
        .patient-field {
          flex: 1;
        }
        .patient-field label {
          font-weight: bold;
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }
        .patient-field .value {
          border-bottom: 1px solid #333;
          min-height: 18px;
          padding-top: 2px;
          font-size: 12px;
        }
        .prescription-area {
          border: 1px solid #000;
          min-height: 280px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .rx-symbol {
          font-size: 24px;
          font-weight: bold;
          color: #1a5f7a;
          margin-bottom: 15px;
        }
        .medication-item {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px dashed #ddd;
        }
        .medication-item:last-child {
          border-bottom: none;
        }
        .med-name {
          font-size: 14px;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
        }
        .med-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          font-size: 11px;
          margin-bottom: 8px;
        }
        .med-details span {
          padding: 3px 0;
        }
        .med-details strong {
          color: #333;
        }
        .med-instructions {
          background: #f5f5f5;
          padding: 8px;
          font-size: 11px;
          border-left: 3px solid #1a5f7a;
          margin-top: 8px;
        }
        .footer-section {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 15px;
        }
        .signature-area {
          width: 45%;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 50px;
          padding-top: 8px;
          font-size: 10px;
        }
        .folio-section {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
        .legal-notice {
          font-size: 9px;
          color: #666;
          text-align: center;
          margin-top: 15px;
          padding: 10px;
          background: #f9f9f9;
          border: 1px solid #eee;
        }
        .cofepris-notice {
          font-size: 8px;
          color: #888;
          text-align: center;
          margin-top: 10px;
        }
        @media print {
          body { padding: 15px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-top">
          <div class="logo-area">Logo del<br>Consultorio</div>
          <div class="doctor-info">
            <div class="doctor-name">Dr. ________________________________</div>
            <div class="doctor-specialty">Especialidad: ________________________________</div>
            <div class="credentials">
              <p><strong>Cédula Profesional:</strong> ________________</p>
              <p><strong>Cédula de Especialidad:</strong> ________________</p>
              <p><strong>Universidad:</strong> ________________________________</p>
            </div>
          </div>
          <div class="contact-info">
            <p><strong>Consultorio:</strong></p>
            <p>Calle y Número: ______________</p>
            <p>Colonia: ______________</p>
            <p>C.P.: _______ Ciudad: __________</p>
            <p>Tel: ______________</p>
          </div>
        </div>
      </div>

      <div class="title-bar">RECETA MÉDICA</div>

      <div class="patient-section">
        <div class="patient-row">
          <div class="patient-field" style="flex: 2;">
            <label>Nombre Completo del Paciente</label>
            <div class="value"></div>
          </div>
          <div class="patient-field">
            <label>Edad</label>
            <div class="value"></div>
          </div>
          <div class="patient-field">
            <label>Sexo</label>
            <div class="value"></div>
          </div>
        </div>
        <div class="patient-row">
          <div class="patient-field" style="flex: 2;">
            <label>Domicilio</label>
            <div class="value"></div>
          </div>
          <div class="patient-field">
            <label>Fecha</label>
            <div class="value">${fechaEmision}</div>
          </div>
        </div>
      </div>

      <div class="prescription-area">
        <div class="rx-symbol">Rp/</div>
        
        <div class="medication-item">
          <div class="med-name">${prescription.medicamento}</div>
          <div class="med-details">
            <span><strong>Dosis:</strong> ${prescription.dosis}</span>
            <span><strong>Presentación:</strong> ____________</span>
            <span><strong>Vía de administración:</strong> ____________</span>
            <span><strong>Cantidad:</strong> ____________</span>
            <span><strong>Frecuencia:</strong> ${prescription.frecuencia}</span>
            <span><strong>Duración del tratamiento:</strong> ${prescription.duracion}</span>
          </div>
          ${prescription.indicaciones ? `
          <div class="med-instructions">
            <strong>Indicaciones especiales:</strong> ${prescription.indicaciones}
          </div>
          ` : ''}
        </div>
      </div>

      <div class="footer-section">
        <div class="signature-area">
          <div class="signature-line">
            <strong>Firma Autógrafa del Médico</strong><br>
            (Conforme a identificación oficial)
          </div>
        </div>
        <div class="signature-area">
          <div class="signature-line">
            <strong>Sello del Consultorio</strong><br>
            (Opcional)
          </div>
        </div>
      </div>

      <div class="folio-section">
        <span><strong>Folio:</strong> RX-${prescription.id.slice(0, 8).toUpperCase()}</span>
        <span><strong>Hora de emisión:</strong> ${format(new Date(), "HH:mm", { locale: es })} hrs</span>
      </div>

      <div class="legal-notice">
        <strong>AVISO IMPORTANTE:</strong> Esta receta es válida únicamente para los medicamentos aquí prescritos.
        La prescripción de medicamentos controlados requiere recetario especial autorizado por COFEPRIS.
        Conserve este documento como comprobante de su consulta médica.
      </div>

      <div class="cofepris-notice">
        Receta elaborada conforme al Artículo 240 de la Ley General de Salud, Artículo 28 y 50 del Reglamento de Insumos para la Salud,
        y lineamientos de COFEPRIS. La información del médico debe corresponder con su cédula profesional registrada.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export default function Recetas() {
  const { data: prescriptions = [], isLoading } = useQuery<PrescriptionWithDetails[]>({
    queryKey: ["/api/prescriptions"],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Recetas</h1>
          <p className="text-muted-foreground">Historial de prescripciones médicas</p>
        </div>
        <NewPrescriptionDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recetas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-count">
              {prescriptions.filter(p => {
                const today = new Date().toDateString();
                return p.createdAt && new Date(p.createdAt).toDateString() === today;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">prescripciones emitidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Recetas</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {prescriptions.length}
            </div>
            <p className="text-xs text-muted-foreground">en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-patients-count">
              {new Set(prescriptions.map(p => p.patientId)).size}
            </div>
            <p className="text-xs text-muted-foreground">con prescripciones</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Recetas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Sin recetas</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Las recetas aparecerán aquí cuando se creen desde el expediente del paciente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-start gap-4 p-4 rounded-md border"
                  data-testid={`prescription-item-${prescription.id}`}
                >
                  <div className="p-2 rounded-md bg-primary/10">
                    <Pill className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{prescription.medicamento}</span>
                      <Badge variant="secondary">{prescription.dosis}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {prescription.frecuencia} - {prescription.duracion}
                    </p>
                    {prescription.indicaciones && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {prescription.indicaciones}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="text-sm text-muted-foreground">
                      {prescription.createdAt && format(new Date(prescription.createdAt), "d MMM yyyy", { locale: es })}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => printPrescription(prescription)}
                      data-testid={`button-print-prescription-${prescription.id}`}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
