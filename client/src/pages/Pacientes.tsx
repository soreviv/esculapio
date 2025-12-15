import { useState } from "react";
import { useLocation } from "wouter";
import { PatientCard } from "@/components/ehr/PatientCard";
import { PatientSearch } from "@/components/ehr/PatientSearch";
import { NewPatientDialog } from "@/components/ehr/NewPatientDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, SortAsc } from "lucide-react";

// todo: remove mock functionality
const mockPatients = [
  {
    id: "1",
    nombre: "María",
    apellidoPaterno: "González",
    apellidoMaterno: "López",
    curp: "GOLM850315MDFRPN09",
    fechaNacimiento: "1985-03-15",
    sexo: "F" as const,
    status: "activo" as const,
    alergias: ["Penicilina", "Aspirina"],
  },
  {
    id: "2",
    nombre: "Juan",
    apellidoPaterno: "Pérez",
    apellidoMaterno: "Ramírez",
    curp: "PERJ780620HDFRPM03",
    fechaNacimiento: "1978-06-20",
    sexo: "M" as const,
    status: "en_consulta" as const,
  },
  {
    id: "3",
    nombre: "Ana",
    apellidoPaterno: "Martínez",
    apellidoMaterno: "Sánchez",
    curp: "MASA920810MDFRNC05",
    fechaNacimiento: "1992-08-10",
    sexo: "F" as const,
    status: "activo" as const,
  },
  {
    id: "4",
    nombre: "Carlos",
    apellidoPaterno: "Mendoza",
    apellidoMaterno: "Ruiz",
    curp: "MERC900520HDFRRL08",
    fechaNacimiento: "1990-05-20",
    sexo: "M" as const,
    status: "activo" as const,
  },
  {
    id: "5",
    nombre: "Laura",
    apellidoPaterno: "Jiménez",
    apellidoMaterno: "Torres",
    curp: "JITL880312MDFRMR02",
    fechaNacimiento: "1988-03-12",
    sexo: "F" as const,
    status: "alta" as const,
    alergias: ["Sulfas"],
  },
  {
    id: "6",
    nombre: "Roberto",
    apellidoPaterno: "Hernández",
    apellidoMaterno: "García",
    curp: "HEGR750825HDFRRB01",
    fechaNacimiento: "1975-08-25",
    sexo: "M" as const,
    status: "activo" as const,
    alergias: ["Ibuprofeno"],
  },
];

export default function Pacientes() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("nombre");

  const filteredPatients = mockPatients
    .filter((patient) => {
      const fullName = `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno}`.toLowerCase();
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
        <NewPatientDialog onSave={(data) => console.log("New patient:", data)} />
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
            >
              ×
            </Button>
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            {...patient}
            onViewRecord={() => setLocation(`/pacientes/${patient.id}`)}
            onSchedule={() => console.log("Schedule:", patient.id)}
          />
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron pacientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Intente con otros términos de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}
