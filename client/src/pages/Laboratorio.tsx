import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Plus, FileText, Clock, Printer, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { LabOrderWithDetails } from "@shared/schema";
import { NewLabOrderDialog } from "@/components/ehr/NewLabOrderDialog";

function printLabOrder(order: LabOrderWithDetails) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const fechaEmision = order.createdAt 
    ? format(new Date(order.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  const estudiosHtml = order.estudios.map(estudio => 
    `<li class="study-item">${estudio}</li>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de Laboratorio</title>
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
        .credentials {
          font-size: 11px;
          color: #333;
        }
        .contact-info {
          text-align: right;
          font-size: 11px;
        }
        .contact-info p {
          margin-bottom: 2px;
        }
        .title-bar {
          background: #2d5a27;
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        .urgent-bar {
          background: #dc2626;
          color: white;
          text-align: center;
          padding: 5px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
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
        .studies-section {
          border: 1px solid #000;
          padding: 15px;
          margin-bottom: 15px;
          min-height: 200px;
        }
        .studies-section h2 {
          font-size: 14px;
          font-weight: bold;
          color: #2d5a27;
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        .study-list {
          list-style: none;
          padding: 0;
        }
        .study-item {
          padding: 8px 12px;
          margin-bottom: 5px;
          background: #f5f5f5;
          border-left: 3px solid #2d5a27;
          font-size: 12px;
        }
        .clinical-info {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
        }
        .clinical-info h3 {
          font-size: 11px;
          font-weight: bold;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .clinical-info p {
          font-size: 12px;
          color: #333;
        }
        .requirements {
          display: flex;
          gap: 20px;
          margin-top: 15px;
          padding: 10px;
          background: #fff3cd;
          border: 1px solid #ffc107;
        }
        .requirement-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
        }
        .checkbox {
          width: 14px;
          height: 14px;
          border: 1px solid #333;
          display: inline-block;
        }
        .checkbox.checked {
          background: #2d5a27;
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
            <div class="doctor-name">Dr. ${order.medicoNombre || '________________________________'}</div>
            <div class="credentials">
              <p><strong>Cédula Profesional:</strong> ________________</p>
              <p><strong>Especialidad:</strong> ________________________________</p>
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

      <div class="title-bar">ORDEN DE LABORATORIO</div>

      ${order.urgente ? '<div class="urgent-bar">URGENTE</div>' : ''}

      <div class="patient-section">
        <div class="patient-row">
          <div class="patient-field" style="flex: 2;">
            <label>Nombre Completo del Paciente</label>
            <div class="value">${order.patientNombre} ${order.patientApellido}</div>
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

      <div class="studies-section">
        <h2>Estudios Solicitados</h2>
        <ul class="study-list">
          ${estudiosHtml}
        </ul>

        ${order.diagnosticoPresuntivo || order.indicacionesClinicas ? `
        <div class="clinical-info">
          ${order.diagnosticoPresuntivo ? `
          <div style="margin-bottom: 10px;">
            <h3>Diagnóstico Presuntivo</h3>
            <p>${order.diagnosticoPresuntivo}</p>
          </div>
          ` : ''}
          ${order.indicacionesClinicas ? `
          <div>
            <h3>Indicaciones Clínicas</h3>
            <p>${order.indicacionesClinicas}</p>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <div class="requirements">
        <div class="requirement-item">
          <span class="checkbox ${order.ayuno ? 'checked' : ''}"></span>
          <span>Ayuno de 8-12 horas</span>
        </div>
        <div class="requirement-item">
          <span class="checkbox ${order.urgente ? 'checked' : ''}"></span>
          <span>Estudio Urgente</span>
        </div>
      </div>

      <div class="footer-section">
        <div class="signature-area">
          <div class="signature-line">
            <strong>Firma del Médico</strong><br>
            Cédula Profesional: _____________
          </div>
        </div>
        <div class="signature-area">
          <div class="signature-line">
            <strong>Sello del Consultorio</strong>
          </div>
        </div>
      </div>

      <div class="folio-section">
        <span><strong>Folio:</strong> LAB-${order.id.slice(0, 8).toUpperCase()}</span>
        <span><strong>Hora de emisión:</strong> ${format(new Date(), "HH:mm", { locale: es })} hrs</span>
      </div>

      <div class="legal-notice">
        <strong>INSTRUCCIONES PARA EL PACIENTE:</strong><br>
        ${order.ayuno ? 'Presentarse en ayuno de 8 a 12 horas. ' : ''}
        Presentar esta orden en el laboratorio de su preferencia.
        Los resultados deben entregarse al médico tratante para su interpretación.
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

export default function Laboratorio() {
  const { data: labOrders = [], isLoading } = useQuery<LabOrderWithDetails[]>({
    queryKey: ["/api/lab-orders"],
  });

  const pendingOrders = labOrders.filter(o => o.status === "pendiente");
  const todayOrders = labOrders.filter(o => {
    const today = new Date().toDateString();
    return o.createdAt && new Date(o.createdAt).toDateString() === today;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Laboratorio</h1>
          <p className="text-muted-foreground">Gestión de estudios y resultados de laboratorio</p>
        </div>
        <NewLabOrderDialog
          trigger={
            <Button data-testid="button-new-lab-order">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-orders">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">estudios por procesar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Hoy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-results-today">{todayOrders.length}</div>
            <p className="text-xs text-muted-foreground">órdenes generadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-total">{labOrders.length}</div>
            <p className="text-xs text-muted-foreground">en el sistema</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Laboratorio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : labOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Sin órdenes de laboratorio</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Las órdenes de laboratorio aparecerán aquí cuando se creen desde el expediente del paciente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {labOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start gap-4 p-4 rounded-md border"
                  data-testid={`lab-order-item-${order.id}`}
                >
                  <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                    <FlaskConical className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{order.patientNombre} {order.patientApellido}</span>
                      {order.urgente && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgente
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {order.status === "pendiente" ? "Pendiente" : 
                         order.status === "en_proceso" ? "En Proceso" :
                         order.status === "completada" ? "Completada" : "Cancelada"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.estudios.join(", ")}
                    </p>
                    {order.diagnosticoPresuntivo && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Dx: {order.diagnosticoPresuntivo}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt && format(new Date(order.createdAt), "d MMM yyyy", { locale: es })}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => printLabOrder(order)}
                      data-testid={`button-print-lab-order-${order.id}`}
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
