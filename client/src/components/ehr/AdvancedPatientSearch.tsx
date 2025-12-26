import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Search, Filter, X } from "lucide-react";
import { type User } from "@shared/schema";

interface AdvancedSearchFilters {
  query?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  diagnostico?: string;
  medicoId?: string;
  status?: string;
}

interface AdvancedPatientSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void;
  onClear: () => void;
}

export function AdvancedPatientSearch({ onSearch, onClear }: AdvancedPatientSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const medicos = users.filter(u => u.role === "medico" || u.role === "admin");

  const handleSearch = () => {
    onSearch(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
    setIsOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== "");

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={hasActiveFilters ? "default" : "outline"} 
          size="sm"
          data-testid="button-advanced-search"
        >
          <Filter className="h-4 w-4 mr-2" />
          Búsqueda Avanzada
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
              {Object.values(filters).filter(v => v && v !== "").length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Búsqueda Avanzada</SheetTitle>
          <SheetDescription>
            Filtre pacientes por múltiples criterios
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="query">Nombre, CURP o Expediente</Label>
            <Input
              id="query"
              placeholder="Buscar..."
              value={filters.query || ""}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              data-testid="input-search-query"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={filters.fechaDesde || ""}
                onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                data-testid="input-fecha-desde"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={filters.fechaHasta || ""}
                onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                data-testid="input-fecha-hasta"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnóstico CIE-10</Label>
            <Input
              id="diagnostico"
              placeholder="Ej: J06.9"
              value={filters.diagnostico || ""}
              onChange={(e) => setFilters({ ...filters, diagnostico: e.target.value })}
              data-testid="input-diagnostico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicoId">Médico Tratante</Label>
            <Select
              value={filters.medicoId || ""}
              onValueChange={(value) => setFilters({ ...filters, medicoId: value === "todos" ? "" : value })}
            >
              <SelectTrigger data-testid="select-medico">
                <SelectValue placeholder="Todos los médicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los médicos</SelectItem>
                {medicos.map((medico) => (
                  <SelectItem key={medico.id} value={medico.id}>
                    {medico.nombre} {medico.especialidad ? `- ${medico.especialidad}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado del Paciente</Label>
            <Select
              value={filters.status || ""}
              onValueChange={(value) => setFilters({ ...filters, status: value === "todos" ? "" : value })}
            >
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="en_consulta">En consulta</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClear} data-testid="button-clear-filters">
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          <Button onClick={handleSearch} data-testid="button-apply-search">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
