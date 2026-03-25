import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Plus, Heart, Thermometer, Wind, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Vitals, Patient } from "@shared/schema";

export default function SignosVitales() {
  const [patientFilter, setPatientFilter] = useState<string>("todos");

  const { data: vitals = [], isLoading } = useQuery<Vitals[]>({
    queryKey: ["/api/vitals"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const getPatientName = (patientId: string) => {
    const p = patients.find((p) => p.id === patientId);
    return p ? `${p.nombre} ${p.apellidoPaterno}` : "Desconocido";
  };

  const filteredVitals = patientFilter === "todos"
    ? vitals
    : vitals.filter((v) => v.patientId === patientFilter);

  const patientsWithVitals = patients.filter((p) => vitals.some((v) => v.patientId === p.id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Signos Vitales</h1>
          <p className="text-muted-foreground">Registro de signos vitales de todos los pacientes</p>
        </div>
        <Button data-testid="button-new-vitals" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Registro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-count">
              {vitals.filter(v => {
                const today = new Date().toDateString();
                return new Date(v.fecha).toDateString() === today;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">mediciones realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {vitals.length}
            </div>
            <p className="text-xs text-muted-foreground">en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-patients-count">
              {new Set(vitals.map(v => v.patientId)).size}
            </div>
            <p className="text-xs text-muted-foreground">con registros</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>Historial de Signos Vitales</CardTitle>
            {patientsWithVitals.length > 0 && (
              <Select value={patientFilter} onValueChange={setPatientFilter}>
                <SelectTrigger className="w-[200px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los pacientes</SelectItem>
                  {patientsWithVitals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellidoPaterno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Sin registros</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Los signos vitales aparecerán aquí cuando se registren desde el expediente del paciente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVitals.map((vital) => (
                <div
                  key={vital.id}
                  className="flex items-start gap-4 p-4 rounded-md border"
                  data-testid={`vital-item-${vital.id}`}
                >
                  <div className="p-2 rounded-md bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getPatientName(vital.patientId)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(vital.presionSistolica || vital.presionDiastolica) && (
                        <Badge variant="outline">
                          <Heart className="h-3 w-3 mr-1" />
                          {vital.presionSistolica}/{vital.presionDiastolica} mmHg
                        </Badge>
                      )}
                      {vital.frecuenciaCardiaca && (
                        <Badge variant="outline">
                          <Activity className="h-3 w-3 mr-1" />
                          {vital.frecuenciaCardiaca} bpm
                        </Badge>
                      )}
                      {vital.temperatura && (
                        <Badge variant="outline">
                          <Thermometer className="h-3 w-3 mr-1" />
                          {vital.temperatura}°C
                        </Badge>
                      )}
                      {vital.frecuenciaRespiratoria && (
                        <Badge variant="outline">
                          <Wind className="h-3 w-3 mr-1" />
                          {vital.frecuenciaRespiratoria} rpm
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      {vital.peso && <span>Peso: {vital.peso} kg</span>}
                      {vital.talla && <span>Talla: {vital.talla} cm</span>}
                      {vital.saturacionOxigeno && <span>SpO2: {vital.saturacionOxigeno}%</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(vital.fecha), "d MMM yyyy HH:mm", { locale: es })}
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
