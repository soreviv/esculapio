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
  Activity,
  Pill,
  CheckCircle2,
  BarChart2,
  PieChart as PieChartIcon,
} from "lucide-react";
import { type Patient, type AppointmentWithDetails, type DashboardMetrics } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const STATUS_COLORS: Record<string, string> = {
  programada: "hsl(var(--chart-1))",
  pendiente: "hsl(var(--chart-2))",
  completada: "hsl(var(--chart-3))",
  cancelada: "hsl(var(--chart-4))",
  no_asistio: "hsl(var(--chart-5))",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const todayAppointments = appointments.filter(apt => apt.fecha === todayStr);
  const recentPatients = patients.slice(0, 3);

  const stats = [
    {
      title: "Pacientes Activos",
      value: metrics?.pacientesActivos ?? 0,
      subtitle: `Total: ${metrics?.totalPacientes ?? 0}`,
      icon: Users,
      trend: metrics?.totalPacientes ? { value: 12, isPositive: true } : undefined,
    },
    {
      title: "Citas Hoy",
      value: metrics?.citasHoy ?? 0,
      subtitle: `${metrics?.citasCompletadas ?? 0} completadas total`,
      icon: Calendar,
    },
    {
      title: "Notas Médicas Hoy",
      value: metrics?.notasMedicasHoy ?? 0,
      subtitle: "Registradas hoy",
      icon: FileText,
    },
    {
      title: "Citas Pendientes",
      value: metrics?.citasPendientes ?? 0,
      subtitle: "Por atender",
      icon: AlertCircle,
    },
    {
      title: "Recetas Activas",
      value: metrics?.prescripcionesActivas ?? 0,
      subtitle: "En tratamiento",
      icon: Pill,
    },
  ];

  const formattedDate = today.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const chartData = metrics?.citasPorDia?.map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
    citas: d.total,
  })) ?? [];

  const pieData = metrics?.citasPorEstado?.map(d => ({
    name: d.estado.charAt(0).toUpperCase() + d.estado.slice(1).replace('_', ' '),
    value: d.total,
    color: STATUS_COLORS[d.estado] || COLORS[0],
  })) ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Panel de Control</h1>
          <p className="text-muted-foreground">
            <Clock className="inline h-4 w-4 mr-1" />
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="h-3 w-3 mr-1" />
            Sistema activo
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricsLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Citas por Día (Últimos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[250px] rounded-lg" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="fecha" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="citas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart2 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sin datos de citas</p>
                <p className="text-xs text-muted-foreground mt-1">Los datos aparecerán cuando se registren citas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Estado de Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[250px] rounded-lg" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PieChartIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sin estado de citas</p>
                <p className="text-xs text-muted-foreground mt-1">El resumen aparecerá cuando haya citas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
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
