import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ehr/StatCard";
import { AppointmentCard } from "@/components/ehr/AppointmentCard";
import { PatientCard } from "@/components/ehr/PatientCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  Users,
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { type Patient, type AppointmentWithDetails } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const todayAppointments = appointments.filter(apt => apt.fecha === todayStr);
  const activePatients = patients.filter(p => p.status === "activo").length;
  const recentPatients = patients.slice(0, 3);

  const stats = [
    {
      title: "Pacientes Activos",
      value: activePatients,
      subtitle: `Total: ${patients.length}`,
      icon: Users,
      trend: patients.length > 0 ? { value: 12, isPositive: true } : undefined,
    },
    {
      title: "Citas Hoy",
      value: todayAppointments.length,
      subtitle: `${todayAppointments.filter(a => a.status === "completada").length} completadas`,
      icon: Calendar,
    },
    {
      title: "Expedientes",
      value: patients.length,
      subtitle: "Registros totales",
      icon: FileText,
    },
    {
      title: "Pendientes",
      value: todayAppointments.filter(a => a.status === "pendiente").length,
      subtitle: "Citas por atender",
      icon: AlertCircle,
    },
  ];

  const formattedDate = today.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Bienvenido</h1>
          <p className="text-muted-foreground">
            <Clock className="inline h-4 w-4 mr-1" />
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Sistema activo
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {patientsLoading || appointmentsLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg font-medium">Citas de Hoy</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/citas")}
                data-testid="link-view-all-appointments"
              >
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointmentsLoading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[80px] rounded-lg" />
                ))
              ) : todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 4).map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    id={apt.id}
                    pacienteNombre={`${apt.patientNombre} ${apt.patientApellido}`}
                    hora={apt.hora}
                    duracion={apt.duracion}
                    motivo={apt.motivo || undefined}
                    status={apt.status as "pendiente" | "en_curso" | "completada" | "no_asistio"}
                    onStartConsult={() => setLocation(`/pacientes/${apt.patientId}`)}
                    onViewPatient={() => setLocation(`/pacientes/${apt.patientId}`)}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay citas programadas para hoy
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg font-medium">
                Pacientes Recientes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/pacientes")}
                data-testid="link-view-all-patients"
              >
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientsLoading ? (
                [1, 2].map((i) => (
                  <Skeleton key={i} className="h-[100px] rounded-lg" />
                ))
              ) : recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    id={patient.id}
                    nombre={patient.nombre}
                    apellidoPaterno={patient.apellidoPaterno}
                    apellidoMaterno={patient.apellidoMaterno || undefined}
                    curp={patient.curp}
                    fechaNacimiento={patient.fechaNacimiento}
                    sexo={patient.sexo as "M" | "F"}
                    status={patient.status as "activo" | "alta" | "en_consulta"}
                    alergias={patient.alergias || undefined}
                    onViewRecord={() => setLocation(`/pacientes/${patient.id}`)}
                    onSchedule={() => setLocation("/citas")}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay pacientes registrados
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
