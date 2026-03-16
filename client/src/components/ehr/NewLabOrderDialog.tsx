import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

export interface NewLabOrderDialogProps {
  patientId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const ESTUDIOS_COMUNES = [
  "Biometría hemática completa",
  "Química sanguínea 6 elementos",
  "Examen general de orina",
  "Perfil de lípidos",
  "Glucosa en ayuno",
  "HbA1c (Hemoglobina glucosilada)",
  "Pruebas de función hepática",
  "Pruebas de función renal (BUN, Creatinina)",
  "Electrolitos séricos",
  "Perfil tiroideo (TSH, T3, T4)",
  "Tiempo de protrombina / INR",
  "Urocultivo",
  "Cultivo de secreción",
  "PCR (Proteína C reactiva)",
  "VSG (Velocidad de sedimentación globular)",
  "Antígeno prostático específico (PSA)",
  "Prueba de embarazo (βhCG)",
  "Grupo sanguíneo y Rh",
];

export function NewLabOrderDialog({ patientId: fixedPatientId, onSuccess, trigger }: NewLabOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [estudiosSeleccionados, setEstudiosSeleccionados] = useState<string[]>([]);
  const [estudioPersonalizado, setEstudioPersonalizado] = useState("");
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState("");
  const [indicacionesClinicas, setIndicacionesClinicas] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [ayuno, setAyuno] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const needsPatientSelector = !fixedPatientId;
  const resolvedPatientId = fixedPatientId ?? selectedPatientId;

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: needsPatientSelector && open,
  });

  const toggleEstudio = (estudio: string) => {
    setEstudiosSeleccionados((prev) =>
      prev.includes(estudio) ? prev.filter((e) => e !== estudio) : [...prev, estudio]
    );
  };

  const addEstudioPersonalizado = () => {
    const trimmed = estudioPersonalizado.trim();
    if (trimmed && !estudiosSeleccionados.includes(trimmed)) {
      setEstudiosSeleccionados((prev) => [...prev, trimmed]);
      setEstudioPersonalizado("");
    }
  };

  const removeEstudio = (estudio: string) => {
    setEstudiosSeleccionados((prev) => prev.filter((e) => e !== estudio));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lab-orders", {
        patientId: resolvedPatientId,
        estudios: estudiosSeleccionados,
        diagnosticoPresuntivo: diagnosticoPresuntivo.trim() || null,
        indicacionesClinicas: indicacionesClinicas.trim() || null,
        urgente,
        ayuno,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear la orden");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", resolvedPatientId, "lab-orders"] });
      toast({ title: "Orden creada", description: "La solicitud de laboratorio ha sido registrada." });
      handleClose();
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setSelectedPatientId("");
    setEstudiosSeleccionados([]);
    setEstudioPersonalizado("");
    setDiagnosticoPresuntivo("");
    setIndicacionesClinicas("");
    setUrgente(false);
    setAyuno(false);
  };

  const isValid = resolvedPatientId && estudiosSeleccionados.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" data-testid="button-new-lab-order">
            <FlaskConical className="h-4 w-4 mr-2" />
            Ordenar Estudio
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            Nueva Solicitud de Laboratorio
          </DialogTitle>
          <DialogDescription>
            Selecciona los estudios y completa la información clínica necesaria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Patient selector */}
          {needsPatientSelector && (
            <div className="space-y-1">
              <Label htmlFor="paciente">Paciente *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger id="paciente">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Estudios seleccionados */}
          {estudiosSeleccionados.length > 0 && (
            <div className="space-y-1">
              <Label>Estudios seleccionados</Label>
              <div className="flex flex-wrap gap-2">
                {estudiosSeleccionados.map((e) => (
                  <Badge key={e} variant="secondary" className="gap-1 pr-1">
                    {e}
                    <button
                      type="button"
                      onClick={() => removeEstudio(e)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Estudios comunes */}
          <div className="space-y-2">
            <Label>Estudios frecuentes</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-slate-50">
              {ESTUDIOS_COMUNES.map((estudio) => (
                <div key={estudio} className="flex items-center gap-2">
                  <Checkbox
                    id={`estudio-${estudio}`}
                    checked={estudiosSeleccionados.includes(estudio)}
                    onCheckedChange={() => toggleEstudio(estudio)}
                  />
                  <label
                    htmlFor={`estudio-${estudio}`}
                    className="text-sm cursor-pointer leading-snug"
                  >
                    {estudio}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Estudio personalizado */}
          <div className="space-y-1">
            <Label>Agregar estudio personalizado</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej. Cultivo faríngeo"
                value={estudioPersonalizado}
                onChange={(e) => setEstudioPersonalizado(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEstudioPersonalizado(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addEstudioPersonalizado}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Diagnóstico presuntivo */}
          <div className="space-y-1">
            <Label htmlFor="diagnostico">Diagnóstico presuntivo</Label>
            <Input
              id="diagnostico"
              placeholder="Ej. Diabetes mellitus tipo 2 descontrolada"
              value={diagnosticoPresuntivo}
              onChange={(e) => setDiagnosticoPresuntivo(e.target.value)}
            />
          </div>

          {/* Indicaciones clínicas */}
          <div className="space-y-1">
            <Label htmlFor="indicaciones">Indicaciones clínicas</Label>
            <Textarea
              id="indicaciones"
              placeholder="Información clínica relevante para el laboratorio"
              rows={2}
              value={indicacionesClinicas}
              onChange={(e) => setIndicacionesClinicas(e.target.value)}
            />
          </div>

          {/* Opciones adicionales */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="urgente"
                checked={urgente}
                onCheckedChange={(v) => setUrgente(!!v)}
              />
              <label htmlFor="urgente" className="text-sm font-medium cursor-pointer text-red-600">
                Urgente
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ayuno"
                checked={ayuno}
                onCheckedChange={(v) => setAyuno(!!v)}
              />
              <label htmlFor="ayuno" className="text-sm cursor-pointer">
                Requiere ayuno
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            {mutation.isPending ? "Guardando..." : "Crear Solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
