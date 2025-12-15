import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllergyAlert } from "@/components/ehr/AllergyAlert";
import { VitalsDisplay, VitalSign } from "@/components/ehr/VitalsDisplay";
import { MedicalNoteCard } from "@/components/ehr/MedicalNoteCard";
import { PrescriptionCard } from "@/components/ehr/PrescriptionCard";
import { NewNoteDialog } from "@/components/ehr/NewNoteDialog";
import { RecordVitalsDialog } from "@/components/ehr/RecordVitalsDialog";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Pill,
  Activity,
  FlaskConical,
  User,
  Phone,
  Mail,
  MapPin,
  Droplet,
} from "lucide-react";

// todo: remove mock functionality
const mockPatient = {
  id: "1",
  nombre: "María",
  apellidoPaterno: "González",
  apellidoMaterno: "López",
  curp: "GOLM850315MDFRPN09",
  fechaNacimiento: "1985-03-15",
  sexo: "F" as const,
  status: "activo" as const,
  alergias: ["Penicilina", "Aspirina"],
  telefono: "55 1234 5678",
  email: "maria.gonzalez@email.com",
  direccion: "Av. Reforma 123, Col. Centro, CDMX, CP 06000",
  grupoSanguineo: "O+",
  contactoEmergencia: "Juan González",
  telefonoEmergencia: "55 8765 4321",
};

// todo: remove mock functionality
const mockVitals: VitalSign[] = [
  { label: "Presión Arterial", value: "135/85", unit: "mmHg", icon: "heart", status: "warning" },
  { label: "Frecuencia Cardíaca", value: 78, unit: "lpm", icon: "activity", status: "normal" },
  { label: "Temperatura", value: 36.8, unit: "°C", icon: "thermometer", status: "normal" },
  { label: "Saturación O2", value: 97, unit: "%", icon: "droplets", status: "normal" },
  { label: "Frecuencia Resp.", value: 18, unit: "rpm", icon: "wind", status: "normal" },
  { label: "Peso", value: 68.5, unit: "kg", icon: "scale", status: "normal" },
];

// todo: remove mock functionality
const mockNotes = [
  {
    id: "1",
    tipo: "nota_evolucion" as const,
    fecha: "15/12/2025",
    hora: "10:30",
    medicoNombre: "Dr. Roberto García",
    especialidad: "Medicina Interna",
    motivoConsulta: "Control de diabetes tipo 2",
    diagnosticos: ["E11.9 DM Tipo 2", "I10 Hipertensión"],
    firmada: true,
  },
  {
    id: "2",
    tipo: "nota_evolucion" as const,
    fecha: "01/12/2025",
    hora: "09:15",
    medicoNombre: "Dr. Roberto García",
    especialidad: "Medicina Interna",
    motivoConsulta: "Revisión de laboratorios",
    diagnosticos: ["E11.9 DM Tipo 2"],
    firmada: true,
  },
  {
    id: "3",
    tipo: "historia_clinica" as const,
    fecha: "15/11/2025",
    hora: "11:00",
    medicoNombre: "Dr. Roberto García",
    especialidad: "Medicina Interna",
    motivoConsulta: "Primera consulta",
    diagnosticos: ["E11.9 DM Tipo 2", "I10 Hipertensión", "E66.9 Obesidad"],
    firmada: true,
  },
];

// todo: remove mock functionality
const mockPrescriptions = [
  {
    medicamento: "Metformina",
    presentacion: "Tabletas 850mg",
    dosis: "1 tableta",
    via: "Oral",
    frecuencia: "Cada 12 horas",
    duracion: "30 días",
    indicaciones: "Tomar con alimentos. Evitar alcohol.",
    status: "activa" as const,
  },
  {
    medicamento: "Losartán",
    presentacion: "Tabletas 50mg",
    dosis: "1 tableta",
    via: "Oral",
    frecuencia: "Cada 24 horas",
    duracion: "30 días",
    indicaciones: "Tomar por la mañana.",
    status: "activa" as const,
  },
  {
    medicamento: "Atorvastatina",
    presentacion: "Tabletas 20mg",
    dosis: "1 tableta",
    via: "Oral",
    frecuencia: "Cada 24 horas",
    duracion: "30 días",
    indicaciones: "Tomar por la noche.",
    status: "completada" as const,
  },
];

function calculateAge(fechaNacimiento: string): number {
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function PatientDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("expediente");

  const patient = mockPatient;
  const fullName = `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno}`;
  const age = calculateAge(patient.fechaNacimiento);
  const initials = `${patient.nombre[0]}${patient.apellidoPaterno[0]}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/pacientes")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{fullName}</h1>
          <p className="text-muted-foreground">Expediente clínico</p>
        </div>
        <div className="flex gap-2">
          <RecordVitalsDialog
            pacienteNombre={fullName}
            onSave={(data) => console.log("Vitals:", data)}
          />
          <NewNoteDialog
            pacienteNombre={fullName}
            onSave={(data) => console.log("Note:", data)}
          />
        </div>
      </div>

      {patient.alergias.length > 0 && (
        <AllergyAlert alergias={patient.alergias} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-medium">{fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  {age} años | {patient.sexo === "F" ? "Femenino" : "Masculino"}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {patient.status === "activo" ? "Activo" : patient.status === "en_consulta" ? "En consulta" : "Alta"}
                </Badge>
              </div>

              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">CURP</p>
                    <p className="font-mono text-xs">{patient.curp}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Droplet className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Grupo Sanguíneo</p>
                    <p>{patient.grupoSanguineo}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p>{patient.telefono}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-xs break-all">{patient.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="text-xs">{patient.direccion}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Contacto de Emergencia</p>
                <p className="text-sm font-medium">{patient.contactoEmergencia}</p>
                <p className="text-xs text-muted-foreground">{patient.telefonoEmergencia}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              <TabsTrigger value="expediente" className="data-[state=active]:bg-muted" data-testid="tab-expediente">
                <FileText className="h-4 w-4 mr-2" />
                Expediente
              </TabsTrigger>
              <TabsTrigger value="signos" className="data-[state=active]:bg-muted" data-testid="tab-signos">
                <Activity className="h-4 w-4 mr-2" />
                Signos Vitales
              </TabsTrigger>
              <TabsTrigger value="recetas" className="data-[state=active]:bg-muted" data-testid="tab-recetas">
                <Pill className="h-4 w-4 mr-2" />
                Recetas
              </TabsTrigger>
              <TabsTrigger value="laboratorio" className="data-[state=active]:bg-muted" data-testid="tab-laboratorio">
                <FlaskConical className="h-4 w-4 mr-2" />
                Laboratorio
              </TabsTrigger>
              <TabsTrigger value="citas" className="data-[state=active]:bg-muted" data-testid="tab-citas">
                <Calendar className="h-4 w-4 mr-2" />
                Citas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expediente" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Notas Médicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockNotes.map((note) => (
                    <MedicalNoteCard
                      key={note.id}
                      {...note}
                      onView={() => console.log("View note:", note.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signos" className="space-y-4 mt-0">
              <VitalsDisplay vitals={mockVitals} fechaRegistro="15/12/2025 10:30" />
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Historial de Signos Vitales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Aquí se mostrará el historial y gráficas de signos vitales.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recetas" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-lg font-medium">Medicamentos</CardTitle>
                    <Button size="sm" data-testid="button-new-prescription">
                      <Pill className="h-4 w-4 mr-2" />
                      Nueva Receta
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockPrescriptions.map((rx, index) => (
                    <PrescriptionCard key={index} {...rx} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="laboratorio" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-lg font-medium">Estudios de Laboratorio</CardTitle>
                    <Button variant="outline" size="sm" data-testid="button-new-lab-order">
                      <FlaskConical className="h-4 w-4 mr-2" />
                      Ordenar Estudio
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No hay estudios de laboratorio registrados.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="citas" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-lg font-medium">Historial de Citas</CardTitle>
                    <Button variant="outline" size="sm" data-testid="button-schedule-appointment">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Cita
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Aquí se mostrará el historial de citas del paciente.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
