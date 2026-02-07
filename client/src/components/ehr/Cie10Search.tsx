import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Cie10Code {
  codigo: string;
  descripcion: string;
  categoria?: string;
}

export interface DiagnosticoSeleccionado {
  codigo: string;
  descripcion: string;
}

interface Cie10SearchProps {
  value: DiagnosticoSeleccionado[];
  onChange: (diagnosticos: DiagnosticoSeleccionado[]) => void;
  placeholder?: string;
  maxDiagnosticos?: number;
  disabled?: boolean;
}

export function Cie10Search({
  value = [],
  onChange,
  placeholder = "Buscar diagnóstico CIE-10...",
  maxDiagnosticos = 5,
  disabled = false,
}: Cie10SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Búsqueda de códigos CIE-10
  const { data: searchResults = [], isLoading } = useQuery<Cie10Code[]>({
    queryKey: ["/api/cie10", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      const response = await fetch(`/api/cie10?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error("Error buscando CIE-10");
      return response.json();
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });

  // Filtrar resultados ya seleccionados
  const filteredResults = searchResults.filter(
    (result) => !value.some((v) => v.codigo === result.codigo)
  );

  // Manejar selección de diagnóstico
  const handleSelect = (codigo: Cie10Code) => {
    if (value.length >= maxDiagnosticos) return;
    
    const nuevoDiagnostico: DiagnosticoSeleccionado = {
      codigo: codigo.codigo,
      descripcion: codigo.descripcion,
    };
    
    onChange([...value, nuevoDiagnostico]);
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Eliminar diagnóstico
  const handleRemove = (codigo: string) => {
    onChange(value.filter((v) => v.codigo !== codigo));
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) {
      if (e.key === "ArrowDown" && searchTerm.length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredResults[highlightedIndex]) {
          handleSelect(filteredResults[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // Abrir lista al escribir
  useEffect(() => {
    if (searchTerm.length >= 2 && filteredResults.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(0);
    } else if (searchTerm.length < 2) {
      setIsOpen(false);
    }
  }, [searchTerm, filteredResults.length]);

  // Scroll al elemento highlighted
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      highlightedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className="space-y-3">
      {/* Diagnósticos seleccionados */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((diag) => (
            <Badge
              key={diag.codigo}
              variant="secondary"
              className="pl-2 pr-1 py-1.5 text-sm flex items-center gap-2 max-w-full"
            >
              <span className="font-bold text-primary">{diag.codigo}</span>
              <span className="truncate">{diag.descripcion}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-destructive/20"
                  onClick={() => handleRemove(diag.codigo)}
                  data-testid={`remove-diag-${diag.codigo}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Campo de búsqueda */}
      {!disabled && value.length < maxDiagnosticos && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchTerm.length >= 2 && filteredResults.length > 0) {
                  setIsOpen(true);
                }
              }}
              onBlur={() => {
                // Delay para permitir click en resultados
                setTimeout(() => setIsOpen(false), 200);
              }}
              placeholder={placeholder}
              className="pl-10 pr-10"
              data-testid="cie10-search-input"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Lista de resultados */}
          {isOpen && filteredResults.length > 0 && (
            <div
              ref={listRef}
              className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg"
            >
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {filteredResults.slice(0, 20).map((result, index) => (
                    <div
                      key={result.codigo}
                      data-index={index}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2 cursor-pointer rounded-sm transition-colors",
                        index === highlightedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleSelect(result)}
                      data-testid={`cie10-option-${result.codigo}`}
                    >
                      <span className="font-mono font-bold text-primary shrink-0 min-w-[80px]">
                        {result.codigo}
                      </span>
                      <span className="text-sm">{result.descripcion}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Sin resultados */}
          {isOpen && searchTerm.length >= 2 && !isLoading && filteredResults.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-muted-foreground text-sm">
              No se encontraron diagnósticos para "{searchTerm}"
            </div>
          )}

          {/* Hint */}
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-xs text-muted-foreground mt-1">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}
        </div>
      )}

      {/* Límite alcanzado */}
      {value.length >= maxDiagnosticos && (
        <p className="text-xs text-muted-foreground">
          Máximo de {maxDiagnosticos} diagnósticos alcanzado
        </p>
      )}
    </div>
  );
}

export default Cie10Search;
