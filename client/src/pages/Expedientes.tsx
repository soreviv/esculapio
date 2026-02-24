import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MedicalNoteCard } from "@/components/ehr/MedicalNoteCard";
import { PatientSearch } from "@/components/ehr/PatientSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, FileText } from "lucide-react";
import type { MedicalNoteWithDetails } from "@shared/schema";

export default function Expedientes() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: notes = [], isLoading } = useQuery<MedicalNoteWithDetails[]>({
    queryKey: ["/api/notes"],
  });

  const filteredRecords = useMemo(() => {
    return notes.filter((record) => {
      const medicoNombre = record.medicoNombre || "";
      const matchesSearch = 
        medicoNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.motivoConsulta && record.motivoConsulta.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record.diagnosticos && record.diagnosticos.some(d => d.codigo.toLowerCase().includes(searchQuery.toLowerCase()) || d.descripcion.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesTipo = tipoFilter === "todos" || record.tipo === tipoFilter;
      const matchesStatus = statusFilter === "todos" || 
        (statusFilter === "firmada" && record.firmada) ||
        (statusFilter === "pendiente" && !record.firmada);

      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [notes, searchQuery, tipoFilter, statusFilter]);

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
            placeholder="Buscar por médico, diagnóstico o motivo..."
          />
        </div>
        <div className="flex gap-2">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="historia_clinica">Historia Clínica</SelectItem>
              <SelectItem value="nota_evolucion">Nota de Evolución</SelectItem>
              <SelectItem value="nota_egreso">Nota de Egreso</SelectItem>
              <SelectItem value="nota_interconsulta">Interconsulta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
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
        {isLoading ? (
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
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No se encontraron expedientes</h3>
            <p className="text-muted-foreground">
              {searchQuery || tipoFilter !== "todos" || statusFilter !== "todos"
                ? "Pruebe ajustando los filtros de búsqueda"
                : "Aún no hay notas médicas registradas"}
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="hover-elevate">
              <CardHeader className="pb-2 border-b mb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-medium">
                      {record.tipo.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {format(new Date(record.fecha), "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <MedicalNoteCard
                  id={record.id}
                  tipo={record.tipo as any}
                  fecha={format(new Date(record.fecha), "dd/MM/yyyy", { locale: es })}
                  hora={record.hora ? record.hora.substring(0, 5) : "--:--"}
                  medicoNombre={record.medicoNombre}
                  especialidad={record.medicoEspecialidad || undefined}
                  motivoConsulta={record.motivoConsulta || undefined}
                  diagnosticos={record.diagnosticos?.map(d => `${d.codigo} ${d.descripcion}`) || []}
                  firmada={record.firmada}
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
