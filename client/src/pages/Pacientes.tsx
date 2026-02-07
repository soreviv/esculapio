import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientCard } from "@/components/ehr/PatientCard";
import { PatientSearch } from "@/components/ehr/PatientSearch";
import { NewPatientDialog } from "@/components/ehr/NewPatientDialog";
import { DeletePatientDialog } from "@/components/ehr/DeletePatientDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, SortAsc } from "lucide-react";
import { type Patient, type InsertPatient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Página que muestra y gestiona el listado de pacientes.
 *
 * Permite buscar, filtrar y ordenar pacientes; crear nuevos registros; eliminar pacientes tras confirmación; y navegar a expedientes o a la pantalla de citas.
 *
 * @returns El elemento React que representa la interfaz de gestión de pacientes.
 */
export default function Pacientes() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("nombre");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const { toast } = useToast();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const patientData = {
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno || null,
        curp: data.curp,
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        grupoSanguineo: data.grupoSanguineo || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccion: data.direccion || null,
        alergias: data.alergias ? data.alergias.split(",").map((a: string) => a.trim()).filter(Boolean) : null,
        contactoEmergencia: data.contactoEmergencia || null,
        telefonoEmergencia: data.telefonoEmergencia || null,
        consentimientoPrivacidad: data.consentimientoPrivacidad || false,
        consentimientoExpediente: data.consentimientoExpediente || false,
      };
      const response = await apiRequest("POST", "/api/patients", patientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Paciente registrado",
        description: "El paciente ha sido registrado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar el paciente.",
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiRequest("DELETE", `/api/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Paciente eliminado",
        description: "El paciente ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el paciente.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (patientToDelete) {
      deletePatientMutation.mutate(patientToDelete.id);
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const filteredPatients = patients
    .filter((patient) => {
      const fullName = `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ""}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        patient.curp.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "todos" || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "nombre") {
        return a.apellidoPaterno.localeCompare(b.apellidoPaterno);
      }
      return 0;
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión del registro de pacientes
          </p>
        </div>
        <NewPatientDialog 
          onSave={(data) => createPatientMutation.mutate(data)} 
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <PatientSearch onSearch={setSearchQuery} />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="en_consulta">En consulta</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="fecha">Fecha registro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{filteredPatients.length} pacientes</Badge>
        {searchQuery && (
          <Badge variant="outline">
            Búsqueda: "{searchQuery}"
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
            >
              ×
            </Button>
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
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
              onDelete={() => handleDeleteClick(patient)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron pacientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            {patients.length === 0 
              ? "Registre un nuevo paciente para comenzar"
              : "Intente con otros términos de búsqueda"}
          </p>
        </div>
      )}

      <DeletePatientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}