import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { MedicalNoteCard } from "@/components/ehr/MedicalNoteCard";
import { useQuery } from "@tanstack/react-query";
import { MedicalNoteCard } from "@/components/ehr/MedicalNoteCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MedicalNoteCard, type MedicalNoteCardProps } from "@/components/ehr/MedicalNoteCard";
import { PatientSearch } from "@/components/ehr/PatientSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MedicalNoteWithPatientDetails } from "@shared/schema";
import { Filter } from "lucide-react";

// todo: remove mock functionality
const mockRecords = [
  {
    id: "1",
    paciente: "María González López",
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
    paciente: "Juan Pérez Ramírez",
    tipo: "interconsulta" as const,
    fecha: "15/12/2025",
    hora: "09:45",
    medicoNombre: "Dra. Ana Martínez",
    especialidad: "Cardiología",
    motivoConsulta: "Evaluación cardiovascular",
    diagnosticos: ["I25.1 Cardiopatía isquémica"],
    firmada: true,
  },
  {
    id: "3",
    paciente: "Carlos Mendoza Ruiz",
    tipo: "nota_evolucion" as const,
    fecha: "14/12/2025",
    hora: "16:20",
    medicoNombre: "Dr. Roberto García",
    especialidad: "Medicina Interna",
    motivoConsulta: "Seguimiento postoperatorio",
    diagnosticos: ["K80.2 Colecistectomía"],
    firmada: false,
  },
  {
    id: "4",
    paciente: "Laura Jiménez Torres",
    tipo: "historia_clinica" as const,
    fecha: "14/12/2025",
    hora: "11:00",
    medicoNombre: "Dr. Roberto García",
    especialidad: "Medicina Interna",
    motivoConsulta: "Primera consulta",
    diagnosticos: ["J45.9 Asma", "J30.4 Rinitis alérgica"],
    firmada: true,
  },
  {
    id: "5",
    paciente: "Roberto Hernández García",
    tipo: "nota_egreso" as const,
    fecha: "13/12/2025",
    hora: "14:30",
    medicoNombre: "Dr. Roberto García",
    especialidad: "Medicina Interna",
    motivoConsulta: "Alta hospitalaria",
    diagnosticos: ["J18.9 Neumonía"],
    firmada: true,
  },
];

export default function Expedientes() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredRecords = mockRecords.filter((record) => {
    const matchesSearch = record.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosticos.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
  const { data: records = [], isLoading } = useQuery<MedicalNoteWithPatientDetails[]>({
    queryKey: ["/api/notes"],
  });

  const formattedRecords = useMemo(() => {
    return records.map(record => ({
      ...record,
      paciente: `${record.patientNombre} ${record.patientApellido}`,
      fechaFormateada: record.fecha ? format(new Date(record.fecha), "dd/MM/yyyy", { locale: es }) : "",
      horaFormateada: record.hora ? record.hora.substring(0, 5) : "",
    }));
  }, [records]);

  const filteredRecords = formattedRecords.filter((record) => {
    const matchesSearch =
      record.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.diagnosticos && record.diagnosticos.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (record.motivoConsulta && record.motivoConsulta.toLowerCase().includes(searchQuery.toLowerCase()));

  const { data: notes = [], isLoading } = useQuery<MedicalNoteWithPatientDetails[]>({
    queryKey: ["/api/notes"],
  });

  const filteredRecords = notes.filter((record) => {
    const patientFullName = `${record.patientNombre} ${record.patientApellido}`;
    const matchesSearch = patientFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.diagnosticos || []).some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTipo = tipoFilter === "todos" || record.tipo === tipoFilter;

    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "firmada" && record.firmada) ||
      (statusFilter === "pendiente" && !record.firmada);

    return matchesSearch && matchesTipo && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Expedientes Clínicos</h1>
          <p className="text-muted-foreground">
            Registro de notas y documentos médicos
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <PatientSearch
            onSearch={setSearchQuery}
            placeholder="Buscar por paciente o diagnóstico..."
          />
        </div>
        <div className="flex gap-2">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="historia_clinica">Historia Clínica</SelectItem>
              <SelectItem value="nota_inicial">Nota de Primera Vez</SelectItem>
              <SelectItem value="nota_evolucion">Nota de Evolución</SelectItem>
              <SelectItem value="nota_egreso">Nota de Egreso</SelectItem>
              <SelectItem value="nota_interconsulta">Interconsulta</SelectItem>
              <SelectItem value="nota_referencia">Nota de Referencia</SelectItem>
              <SelectItem value="nota_ingreso">Nota de Ingreso</SelectItem>
              <SelectItem value="nota_preoperatoria">Nota Preoperatoria</SelectItem>
              <SelectItem value="nota_postoperatoria">Nota Postoperatoria</SelectItem>
              <SelectItem value="nota_preanestesica">Nota Preanestésica</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-signature-filter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="firmada">Firmadas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{filteredRecords.length} registros</Badge>
        {searchQuery && (
          <Badge variant="outline">Búsqueda: "{searchQuery}"</Badge>
        )}
      </div>

      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover-elevate">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base font-medium">
                  {record.paciente}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {record.fecha}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <MedicalNoteCard
                {...record}
                onView={() => setLocation(`/pacientes/${record.id}`)}
              />
            </CardContent>
          </Card>
        ))}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Cargando expedientes...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No se encontraron expedientes</h3>
            <p className="text-muted-foreground">
              {searchQuery || tipoFilter !== "todos" || statusFilter !== "todos"
                ? "Pruebe ajustando los filtros de búsqueda"
                : "Aún no hay notas médicas registradas en el sistema"}
            </p>
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="hover-elevate">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base font-medium">
                    {record.patientNombre} {record.patientApellido}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(record.fecha), "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <MedicalNoteCard
                  id={record.id}
                  tipo={record.tipo as MedicalNoteCardProps['tipo']}
                  fecha={format(new Date(record.fecha), "dd/MM/yyyy", { locale: es })}
                  hora={record.hora ? record.hora.substring(0, 5) : format(new Date(record.fecha), "HH:mm", { locale: es })}
                  medicoNombre={record.medicoNombre}
                  especialidad={record.medicoEspecialidad || undefined}
                  motivoConsulta={record.motivoConsulta || undefined}
                  diagnosticos={record.diagnosticos || []}
                  firmada={record.firmada}
                  onView={() => setLocation(`/pacientes/${record.patientId}`)}
                />
              </CardContent>
            </Card>
          ))
        )}

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron expedientes</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="hover-elevate">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base font-medium">
                    {record.paciente}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {record.fechaFormateada}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <MedicalNoteCard
                  {...record}
                  fecha={record.fechaFormateada}
                  hora={record.horaFormateada}
                  especialidad={record.medicoEspecialidad || undefined}
                  onView={() => setLocation(`/pacientes/${record.patientId}`)}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
