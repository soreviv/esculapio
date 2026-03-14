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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

export interface NewPrescriptionDialogProps {
  /** Si se omite, el diálogo muestra un selector de paciente */
  patientId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const VIAS = ["Oral", "Intravenosa", "Intramuscular", "Subcutánea", "Tópica", "Inhalatoria", "Sublingual", "Rectal", "Oftálmica", "Ótica", "Nasal"];

export function NewPrescriptionDialog({ patientId: fixedPatientId, onSuccess, trigger }: NewPrescriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const needsPatientSelector = !fixedPatientId;

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: needsPatientSelector && open,
  });

  const [form, setForm] = useState({
    medicamento: "",
    presentacion: "",
    dosis: "",
    via: "",
    frecuencia: "",
    duracion: "",
    indicaciones: "",
  });

  const resolvedPatientId = fixedPatientId ?? selectedPatientId;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        patientId: resolvedPatientId,
        medicamento: form.medicamento,
        presentacion: form.presentacion || null,
        dosis: form.dosis,
        via: form.via,
        frecuencia: form.frecuencia,
        duracion: form.duracion || null,
        indicaciones: form.indicaciones || null,
        status: "activa",
      };
      const res = await apiRequest("POST", "/api/prescriptions", payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear la receta");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", resolvedPatientId, "prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Receta creada", description: "La receta ha sido registrada correctamente." });
      setOpen(false);
      setSelectedPatientId("");
      setForm({ medicamento: "", presentacion: "", dosis: "", via: "", frecuencia: "", duracion: "", indicaciones: "" });
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isValid =
    resolvedPatientId &&
    form.medicamento.trim() &&
    form.dosis.trim() &&
    form.via &&
    form.frecuencia.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" data-testid="button-new-prescription">
            <Pill className="h-4 w-4 mr-2" />
            Nueva Receta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Receta</DialogTitle>
          <DialogDescription>Registra un nuevo medicamento para el paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            {needsPatientSelector && (
              <div className="col-span-2 space-y-1">
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
            <div className="col-span-2 space-y-1">
              <Label htmlFor="medicamento">Medicamento *</Label>
              <Input
                id="medicamento"
                placeholder="Ej. Paracetamol"
                value={form.medicamento}
                onChange={(e) => setForm((f) => ({ ...f, medicamento: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="presentacion">Presentación</Label>
              <Input
                id="presentacion"
                placeholder="Ej. 500 mg tableta"
                value={form.presentacion}
                onChange={(e) => setForm((f) => ({ ...f, presentacion: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dosis">Dosis *</Label>
              <Input
                id="dosis"
                placeholder="Ej. 1 tableta"
                value={form.dosis}
                onChange={(e) => setForm((f) => ({ ...f, dosis: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="via">Vía de administración *</Label>
              <Select value={form.via} onValueChange={(v) => setForm((f) => ({ ...f, via: v }))}>
                <SelectTrigger id="via">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {VIAS.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Input
                id="frecuencia"
                placeholder="Ej. Cada 8 horas"
                value={form.frecuencia}
                onChange={(e) => setForm((f) => ({ ...f, frecuencia: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="duracion">Duración</Label>
              <Input
                id="duracion"
                placeholder="Ej. 7 días"
                value={form.duracion}
                onChange={(e) => setForm((f) => ({ ...f, duracion: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="indicaciones">Indicaciones adicionales</Label>
              <Textarea
                id="indicaciones"
                placeholder="Ej. Tomar con alimentos"
                rows={3}
                value={form.indicaciones}
                onChange={(e) => setForm((f) => ({ ...f, indicaciones: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Receta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
