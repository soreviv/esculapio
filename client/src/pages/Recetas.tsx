import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PrescriptionWithDetails } from "@shared/schema";

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
        <Button data-testid="button-new-prescription" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Receta
        </Button>
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
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">
                      {prescription.createdAt && format(new Date(prescription.createdAt), "d MMM yyyy", { locale: es })}
                    </p>
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
