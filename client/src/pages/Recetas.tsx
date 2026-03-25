import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, Calendar, User, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PrescriptionWithDetails, Patient, EstablishmentConfig, User as UserType } from "@shared/schema";

import { NewPrescriptionDialog } from "@/components/ehr/NewPrescriptionDialog";
import { printPrescriptionCOFEPRIS } from "@/lib/print-documents";
import { apiRequest } from "@/lib/queryClient";

export default function Recetas() {
  const queryClient = useQueryClient();
  const { data: prescriptions = [], isLoading } = useQuery<PrescriptionWithDetails[]>({
    queryKey: ["/api/prescriptions"],
  });
  const { data: currentUser } = useQuery<UserType>({ queryKey: ["/api/auth/me"] });
  const { data: establishment } = useQuery<EstablishmentConfig | null>({ queryKey: ["/api/config/establishment"] });
  const { data: patients = [] } = useQuery<Patient[]>({ queryKey: ["/api/patients"] });

  const handlePrint = async (prescription: PrescriptionWithDetails) => {
    const patients = queryClient.getQueryData<Patient[]>(["/api/patients"]);
    const patient = patients?.find((p) => p.id === prescription.patientId)
      ?? await apiRequest("GET", `/api/patients/${prescription.patientId}`).then((r) => r.json());
    printPrescriptionCOFEPRIS({
      prescriptions: [prescription] as never,
      instruccionesGenerales: prescription.instruccionesGenerales ?? undefined,
      patient,
      medico: currentUser ?? {},
      establishment: establishment ?? undefined,
    });
  };

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
                    {(() => {
                      const pat = patients.find(p => p.id === prescription.patientId);
                      return pat ? (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {pat.nombre} {pat.apellidoPaterno} {pat.apellidoMaterno ?? ""}
                        </p>
                      ) : null;
                    })()}
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
                      onClick={() => handlePrint(prescription)}
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
