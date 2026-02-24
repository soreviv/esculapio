import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AllergyAlert } from "@/components/ehr/AllergyAlert";
import { VitalsDisplay, VitalSign } from "@/components/ehr/VitalsDisplay";
import { MedicalNoteCard } from "@/components/ehr/MedicalNoteCard";
import { PrescriptionCard } from "@/components/ehr/PrescriptionCard";
import { NewNoteDialog } from "@/components/ehr/NewNoteDialog";
import { RecordVitalsDialog } from "@/components/ehr/RecordVitalsDialog";
import { PatientTimeline } from "@/components/ehr/PatientTimeline";
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
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { type Patient, type MedicalNoteWithDetails, type Vitals, type PrescriptionWithDetails, type InsertVitals, type PatientConsent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

function formatVitals(vitals: Vitals): VitalSign[] {
  const signs: VitalSign[] = [];
  
  if (vitals.presionSistolica && vitals.presionDiastolica) {
    const bp = `${vitals.presionSistolica}/${vitals.presionDiastolica}`;
    const status = vitals.presionSistolica > 130 || vitals.presionDiastolica > 85 ? "warning" : "normal";
    signs.push({ label: "Presión Arterial", value: bp, unit: "mmHg", icon: "heart", status });
  }
  
  if (vitals.frecuenciaCardiaca) {
    const status = vitals.frecuenciaCardiaca < 60 || vitals.frecuenciaCardiaca > 100 ? "warning" : "normal";
    signs.push({ label: "Frecuencia Cardíaca", value: vitals.frecuenciaCardiaca, unit: "lpm", icon: "activity", status });
  }
  
  if (vitals.temperatura) {
    const status = vitals.temperatura > 37.5 ? "critical" : "normal";
    signs.push({ label: "Temperatura", value: vitals.temperatura, unit: "°C", icon: "thermometer", status });
  }
  
  if (vitals.saturacionOxigeno) {
    const status = vitals.saturacionOxigeno < 95 ? "warning" : "normal";
    signs.push({ label: "Saturación O2", value: vitals.saturacionOxigeno, unit: "%", icon: "droplets", status });
  }
  
  if (vitals.frecuenciaRespiratoria) {
    signs.push({ label: "Frecuencia Resp.", value: vitals.frecuenciaRespiratoria, unit: "rpm", icon: "wind", status: "normal" });
  }
  
  if (vitals.peso) {
    signs.push({ label: "Peso", value: vitals.peso, unit: "kg", icon: "scale", status: "normal" });
  }
  
  return signs;
}

export default function PatientDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("expediente");
  const { toast } = useToast();

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", params.id],
    enabled: !!params.id,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery<MedicalNoteWithDetails[]>({
    queryKey: ["/api/patients", params.id, "notes"],
    enabled: !!params.id,
  });

  const { data: latestVitals } = useQuery<Vitals | null>({
    queryKey: ["/api/patients", params.id, "vitals", "latest"],
    enabled: !!params.id,
  });

  const { data: prescriptions = [] } = useQuery<PrescriptionWithDetails[]>({
    queryKey: ["/api/patients", params.id, "prescriptions"],
    enabled: !!params.id,
  });

  const { data: consents = [] } = useQuery<PatientConsent[]>({
    queryKey: ["/api/patients", params.id, "consents"],
    enabled: !!params.id,
  });

  const handleNoteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/patients", params.id, "notes"] });
  };

  const createVitalsMutation = useMutation({
    mutationFn: async (data: any) => {
      const vitalsData: InsertVitals = {
        patientId: patient?.id || "",
        presionSistolica: data.presionSistolica ? parseInt(data.presionSistolica) : null,
        presionDiastolica: data.presionDiastolica ? parseInt(data.presionDiastolica) : null,
        frecuenciaCardiaca: data.frecuenciaCardiaca ? parseInt(data.frecuenciaCardiaca) : null,
        frecuenciaRespiratoria: data.frecuenciaRespiratoria ? parseInt(data.frecuenciaRespiratoria) : null,
        temperatura: data.temperatura ? parseFloat(data.temperatura) : null,
        saturacionOxigeno: data.saturacionOxigeno ? parseInt(data.saturacionOxigeno) : null,
        peso: data.peso ? parseFloat(data.peso) : null,
        talla: data.talla ? parseInt(data.talla) : null,
        glucosa: data.glucosa ? parseInt(data.glucosa) : null,
      };
      const response = await apiRequest("POST", "/api/vitals", vitalsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params.id, "vitals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params.id, "vitals", "latest"] });
      toast({
        title: "Signos registrados",
        description: "Los signos vitales han sido registrados.",
      });
    },
  });

  if (patientLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[400px]" />
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Paciente no encontrado</p>
        <Button variant="ghost" onClick={() => setLocation("/pacientes")}>
          Volver a pacientes
        </Button>
      </div>
    );
  }

  const fullName = `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ""}`;
  const age = calculateAge(patient.fechaNacimiento);
  const initials = `${patient.nombre[0]}${patient.apellidoPaterno[0]}`;
  const vitalsForDisplay = latestVitals ? formatVitals(latestVitals) : [];
  const vitalsDate = latestVitals?.fecha 
    ? new Date(latestVitals.fecha).toLocaleDateString("es-MX", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : undefined;

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
            onSave={(data) => createVitalsMutation.mutate(data)}
          />
          <NewNoteDialog
            patientId={patient.id}
            patientNombre={fullName}
            medicoId="system"
            onSuccess={handleNoteSuccess}
          />
        </div>
      </div>

      {patient.alergias && patient.alergias.length > 0 && (
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
                {patient.grupoSanguineo && (
                  <div className="flex items-start gap-2 text-sm">
                    <Droplet className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Grupo Sanguíneo</p>
                      <p>{patient.grupoSanguineo}</p>
                    </div>
                  </div>
                )}
                {patient.telefono && (
                  <div className="flex items-start gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p>{patient.telefono}</p>
                    </div>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-start gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs break-all">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.direccion && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="text-xs">{patient.direccion}</p>
                    </div>
                  </div>
                )}
              </div>

              {patient.contactoEmergencia && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Contacto de Emergencia</p>
                  <p className="text-sm font-medium">{patient.contactoEmergencia}</p>
                  {patient.telefonoEmergencia && (
                    <p className="text-xs text-muted-foreground">{patient.telefonoEmergencia}</p>
                  )}
                </div>
              )}
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
              <TabsTrigger value="consentimientos" className="data-[state=active]:bg-muted" data-testid="tab-consentimientos">
                <Shield className="h-4 w-4 mr-2" />
                Consentimientos
              </TabsTrigger>
              <TabsTrigger value="historia" className="data-[state=active]:bg-muted" data-testid="tab-historia">
                <Clock className="h-4 w-4 mr-2" />
                Historia Clínica
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expediente" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Notas Médicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notesLoading ? (
                    [1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-[100px]" />
                    ))
                  ) : notes.length > 0 ? (
                    notes.map((note) => (
                      <MedicalNoteCard
                        key={note.id}
                        id={note.id}
                        tipo={note.tipo}
                        fecha={new Date(note.fecha).toLocaleDateString("es-MX")}
                        hora={note.hora ? note.hora.substring(0, 5) : new Date(note.fecha).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        medicoNombre={note.medicoNombre}
                        motivoConsulta={note.motivoConsulta || ""}
                        diagnosticos={note.diagnosticos || []}
                        firmada={note.firmada}
                        onView={() => console.log("View note:", note.id)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay notas médicas registradas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signos" className="space-y-4 mt-0">
              {vitalsForDisplay.length > 0 ? (
                <VitalsDisplay vitals={vitalsForDisplay} fechaRegistro={vitalsDate} />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No hay signos vitales registrados</p>
                  </CardContent>
                </Card>
              )}
              
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
                  {prescriptions.length > 0 ? (
                    prescriptions.map((rx) => (
                      <PrescriptionCard
                        key={rx.id}
                        medicamento={rx.medicamento}
                        presentacion={rx.presentacion || ""}
                        dosis={rx.dosis}
                        via={rx.via}
                        frecuencia={rx.frecuencia}
                        duracion={rx.duracion || ""}
                        indicaciones={rx.indicaciones || undefined}
                        status={rx.status as "activa" | "completada" | "cancelada"}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                      No hay recetas registradas
                    </p>
                  )}
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

            <TabsContent value="consentimientos" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Consentimientos (LFPDPPP)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {consents.length > 0 ? (
                    consents.map((consent) => (
                      <div key={consent.id} className="flex items-start gap-4 p-4 rounded-md border" data-testid={`consent-item-${consent.id}`}>
                        <div className="p-2 rounded-md bg-primary/10">
                          {consent.aceptado ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {consent.tipoConsentimiento === "privacidad" && "Aviso de Privacidad"}
                            {consent.tipoConsentimiento === "expediente_electronico" && "Expediente Clínico Electrónico"}
                            {consent.tipoConsentimiento === "tratamiento_datos" && "Tratamiento de Datos Personales"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Versión: {consent.version}
                          </p>
                          {consent.fechaAceptacion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Aceptado el: {new Date(consent.fechaAceptacion).toLocaleDateString("es-MX", { 
                                year: "numeric", 
                                month: "long", 
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          )}
                        </div>
                        <Badge variant={consent.aceptado ? "default" : "destructive"}>
                          {consent.aceptado ? "Aceptado" : "No aceptado"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay registros de consentimiento</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Los consentimientos se registran al momento de dar de alta al paciente.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historia" className="mt-0">
              <PatientTimeline patientId={patient.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
