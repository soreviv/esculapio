import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppointmentCard } from "@/components/ehr/AppointmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ChevronLeft, ChevronRight, Link2, Globe } from "lucide-react";
import { type AppointmentWithDetails } from "@shared/schema";
import type { Patient } from "@shared/schema";

export default function Citas() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [viewFilter, setViewFilter] = useState("todas");
  const [linkingAppt, setLinkingAppt] = useState<AppointmentWithDetails | null>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !!linkingAppt,
  });

  const linkMutation = useMutation({
    mutationFn: ({ apptId, patientId }: { apptId: string; patientId: string }) =>
      apiRequest("POST", `/api/appointments/${apptId}/link-patient`, { patientId }),
    onSuccess: () => {
      toast({ title: "Cita vinculada al paciente correctamente" });
      setLinkingAppt(null);
      void queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: () => toast({ title: "Error al vincular la cita", variant: "destructive" }),
  });

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellidoPaterno.toLowerCase().includes(q) ||
      (p.curp ?? "").toLowerCase().includes(q)
    );
  }).slice(0, 10);

  const selectedDateStr = date?.toISOString().split('T')[0] || "";
  
  const dayAppointments = appointments.filter(apt => apt.fecha === selectedDateStr);

  const filteredAppointments = dayAppointments.filter((apt) => {
    if (viewFilter === "todas") return true;
    return apt.status === viewFilter;
  });

  const stats = {
    total: dayAppointments.length,
    completadas: dayAppointments.filter((a) => a.status === "completada").length,
    pendientes: dayAppointments.filter((a) => a.status === "pendiente").length,
    enCurso: dayAppointments.filter((a) => a.status === "en_curso").length,
  };

  const goToNextDay = () => {
    if (date) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      setDate(next);
    }
  };

  const goToPrevDay = () => {
    if (date) {
      const prev = new Date(date);
      prev.setDate(prev.getDate() - 1);
      setDate(prev);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Agenda de Citas</h1>
          <p className="text-muted-foreground">
            Gestión de citas y consultas
          </p>
        </div>
        <Button data-testid="button-new-appointment">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md w-full"
                classNames={{
                  head_row: "flex justify-between",
                  row: "flex w-full mt-2 justify-between",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
                  cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resumen del Día</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <Badge variant="secondary">{stats.total}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completadas</span>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {stats.completadas}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">En curso</span>
                <Badge className="bg-primary text-primary-foreground">
                  {stats.enCurso}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pendientes</span>
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  {stats.pendientes}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={goToPrevDay}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg font-medium">
                    {date?.toLocaleDateString("es-MX", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={goToNextDay}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={viewFilter} onValueChange={setViewFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-appointment-filter">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="en_curso">En curso</SelectItem>
                    <SelectItem value="completada">Completadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointmentsLoading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[80px] rounded-lg" />
                ))
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => {
                  const isPortal = apt.bookingSource === "portal" && !apt.patientId;
                  const displayName = isPortal
                    ? (apt.patientName ?? "Paciente del portal")
                    : `${apt.patientNombre ?? ""} ${apt.patientApellido ?? ""}`.trim();
                  return (
                    <div key={apt.id} className="relative">
                      <AppointmentCard
                        id={apt.id}
                        pacienteNombre={displayName}
                        hora={apt.hora}
                        duracion={apt.duracion}
                        motivo={apt.motivo || undefined}
                        status={apt.status as "pendiente" | "en_curso" | "completada" | "no_asistio"}
                        onStartConsult={isPortal ? undefined : () => setLocation(`/pacientes/${apt.patientId}`)}
                        onViewPatient={isPortal ? undefined : () => setLocation(`/pacientes/${apt.patientId}`)}
                      />
                      {isPortal && (
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Globe className="h-3 w-3" />
                            Portal
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => { setLinkingAppt(apt); setPatientSearch(""); }}
                          >
                            <Link2 className="h-3 w-3" />
                            Vincular paciente
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay citas para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Link portal appointment to EHR patient */}
      <Dialog open={!!linkingAppt} onOpenChange={(open) => !open && setLinkingAppt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular cita a paciente EHR</DialogTitle>
            <DialogDescription>
              Cita del portal: <strong>{linkingAppt?.patientName}</strong>
              {linkingAppt?.fecha && ` — ${linkingAppt.fecha} ${linkingAppt.hora}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Buscar por nombre o CURP…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              autoFocus
            />
            <ul className="divide-y border rounded-md max-h-64 overflow-auto">
              {filteredPatients.length === 0 ? (
                <li className="p-3 text-sm text-muted-foreground text-center">
                  {patientSearch ? "Sin resultados" : "Escriba para buscar"}
                </li>
              ) : (
                filteredPatients.map((p) => (
                  <li key={p.id}>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm"
                      onClick={() => linkMutation.mutate({ apptId: linkingAppt!.id, patientId: p.id })}
                      disabled={linkMutation.isPending}
                    >
                      <span className="font-medium">{p.nombre} {p.apellidoPaterno}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{p.curp}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
