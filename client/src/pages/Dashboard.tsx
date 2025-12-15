import { useState } from "react";
import { StatCard } from "@/components/ehr/StatCard";
import { AppointmentCard } from "@/components/ehr/AppointmentCard";
import { PatientCard } from "@/components/ehr/PatientCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// todo: remove mock functionality
const mockStats = [
  {
    title: "Pacientes Activos",
    value: 248,
    subtitle: "Total registrados",
    icon: Users,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Citas Hoy",
    value: 12,
    subtitle: "3 completadas",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    value: 1247,
    subtitle: "Este mes: 45 nuevos",
    icon: FileText,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Pendientes",
    value: 5,
    subtitle: "Notas sin firmar",
    icon: AlertCircle,
  },
];

// todo: remove mock functionality
const mockAppointments = [
  {
    id: "1",
    pacienteNombre: "María González López",
    hora: "09:00",
    duracion: "30 min",
    motivo: "Control de diabetes",
    status: "completada" as const,
  },
  {
    id: "2",
    pacienteNombre: "Juan Pérez Ramírez",
    hora: "09:30",
    duracion: "30 min",
    motivo: "Revisión postoperatoria",
    status: "en_curso" as const,
  },
  {
    id: "3",
    pacienteNombre: "Ana Martínez Sánchez",
    hora: "10:00",
    duracion: "45 min",
    motivo: "Primera consulta",
    status: "pendiente" as const,
  },
  {
    id: "4",
    pacienteNombre: "Roberto Hernández",
    hora: "10:45",
    duracion: "30 min",
    motivo: "Seguimiento hipertensión",
    status: "pendiente" as const,
  },
];

// todo: remove mock functionality
const mockRecentPatients = [
  {
    id: "1",
    nombre: "Carlos",
    apellidoPaterno: "Mendoza",
    apellidoMaterno: "Ruiz",
    curp: "MERC900520HDFRRL08",
    fechaNacimiento: "1990-05-20",
    sexo: "M" as const,
    status: "activo" as const,
  },
  {
    id: "2",
    nombre: "Laura",
    apellidoPaterno: "Jiménez",
    apellidoMaterno: "Torres",
    curp: "JITL880312MDFRMR02",
    fechaNacimiento: "1988-03-12",
    sexo: "F" as const,
    status: "en_consulta" as const,
    alergias: ["Penicilina"],
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Buenos días, Dr. García</h1>
          <p className="text-muted-foreground">
            <Clock className="inline h-4 w-4 mr-1" />
            Lunes, 15 de diciembre de 2025
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
        {mockStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
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
              {mockAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  {...apt}
                  onStartConsult={() => console.log("Start consult:", apt.id)}
                  onViewPatient={() => setLocation(`/pacientes/${apt.id}`)}
                />
              ))}
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
              {mockRecentPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  {...patient}
                  onViewRecord={() => setLocation(`/pacientes/${patient.id}`)}
                  onSchedule={() => console.log("Schedule:", patient.id)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
