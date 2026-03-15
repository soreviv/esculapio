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
import { Separator } from "@/components/ui/separator";
import { Pill, Plus, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { printPrescriptionCOFEPRIS } from "@/lib/print-documents";
import type { Patient, User, EstablishmentConfig } from "@shared/schema";

export interface NewPrescriptionDialogProps {
  /** Si se omite, el diálogo muestra un selector de paciente */
  patientId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const VIAS = [
  "Oral", "Intravenosa", "Intramuscular", "Subcutánea",
  "Tópica", "Inhalatoria", "Sublingual", "Rectal",
  "Oftálmica", "Ótica", "Nasal",
];

interface MedicamentoForm {
  medicamento: string;
  presentacion: string;
  dosis: string;
  via: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
}

const emptyMed = (): MedicamentoForm => ({
  medicamento: "",
  presentacion: "",
  dosis: "",
  via: "",
  frecuencia: "",
  duracion: "",
  indicaciones: "",
});

export function NewPrescriptionDialog({ patientId: fixedPatientId, onSuccess, trigger }: NewPrescriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [medicamentos, setMedicamentos] = useState<MedicamentoForm[]>([emptyMed()]);
  const [instruccionesGenerales, setInstruccionesGenerales] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const needsPatientSelector = !fixedPatientId;
  const resolvedPatientId = fixedPatientId ?? selectedPatientId;

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: needsPatientSelector && open,
  });

  // Fetch current doctor and establishment for PDF
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: open,
  });

  const { data: establishment } = useQuery<EstablishmentConfig | null>({
    queryKey: ["/api/config/establishment"],
    enabled: open,
  });

  const updateMed = (index: number, field: keyof MedicamentoForm, value: string) => {
    setMedicamentos((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addMed = () => setMedicamentos((prev) => [...prev, emptyMed()]);

  const removeMed = (index: number) => {
    if (medicamentos.length === 1) return;
    setMedicamentos((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/prescriptions/batch", {
        patientId: resolvedPatientId,
        instruccionesGenerales: instruccionesGenerales.trim() || null,
        medicamentos: medicamentos.map((m) => ({
          medicamento: m.medicamento,
          presentacion: m.presentacion || null,
          dosis: m.dosis,
          via: m.via,
          frecuencia: m.frecuencia,
          duracion: m.duracion || null,
          indicaciones: m.indicaciones || null,
        })),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear la receta");
      }
      return res.json() as Promise<{ recetaId: string; prescriptions: { id: string; medicamento: string; presentacion: string | null; dosis: string; via: string; frecuencia: string; duracion: string | null; indicaciones: string | null; instruccionesGenerales: string | null }[] }>;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", resolvedPatientId, "prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Receta creada", description: "La receta ha sido registrada. Generando PDF..." });

      // Fetch patient for PDF
      const patients = queryClient.getQueryData<Patient[]>(["/api/patients"]);
      const patient = patients?.find((p) => p.id === resolvedPatientId)
        ?? (await apiRequest("GET", `/api/patients/${resolvedPatientId}`).then((r) => r.json()));

      printPrescriptionCOFEPRIS({
        prescriptions: data.prescriptions as never,
        instruccionesGenerales: instruccionesGenerales.trim() || undefined,
        patient,
        medico: currentUser ?? {},
        establishment: establishment ?? undefined,
      });

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
    setMedicamentos([emptyMed()]);
    setInstruccionesGenerales("");
  };

  const isValid =
    resolvedPatientId &&
    medicamentos.every(
      (m) => m.medicamento.trim() && m.dosis.trim() && m.via && m.frecuencia.trim()
    );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" data-testid="button-new-prescription">
            <Pill className="h-4 w-4 mr-2" />
            Nueva Receta
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Nueva Receta Médica
          </DialogTitle>
          <DialogDescription>
            Agrega uno o más medicamentos. Al guardar se generará el PDF de la receta.
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

          {/* Medications list */}
          {medicamentos.map((med, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-700">
                  Medicamento {idx + 1}
                </span>
                {medicamentos.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeMed(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Medicamento *</Label>
                  <Input
                    placeholder="Ej. Paracetamol"
                    value={med.medicamento}
                    onChange={(e) => updateMed(idx, "medicamento", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Presentación</Label>
                  <Input
                    placeholder="Ej. 500 mg tableta"
                    value={med.presentacion}
                    onChange={(e) => updateMed(idx, "presentacion", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Dosis *</Label>
                  <Input
                    placeholder="Ej. 1 tableta"
                    value={med.dosis}
                    onChange={(e) => updateMed(idx, "dosis", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Vía de administración *</Label>
                  <Select value={med.via} onValueChange={(v) => updateMed(idx, "via", v)}>
                    <SelectTrigger>
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
                  <Label>Frecuencia *</Label>
                  <Input
                    placeholder="Ej. Cada 8 horas"
                    value={med.frecuencia}
                    onChange={(e) => updateMed(idx, "frecuencia", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Duración del tratamiento</Label>
                  <Input
                    placeholder="Ej. 7 días"
                    value={med.duracion}
                    onChange={(e) => updateMed(idx, "duracion", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Indicaciones del medicamento</Label>
                  <Textarea
                    placeholder="Ej. Tomar con alimentos, evitar alcohol"
                    rows={2}
                    value={med.indicaciones}
                    onChange={(e) => updateMed(idx, "indicaciones", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
            onClick={addMed}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar otro medicamento
          </Button>

          <Separator />

          {/* General instructions */}
          <div className="space-y-1">
            <Label htmlFor="instrucciones">Instrucciones médicas generales</Label>
            <Textarea
              id="instrucciones"
              placeholder="Ej. Reposo relativo, dieta blanda, abundantes líquidos. Regresar en 7 días o antes si presenta fiebre mayor a 38.5°C"
              rows={3}
              value={instruccionesGenerales}
              onChange={(e) => setInstruccionesGenerales(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {mutation.isPending ? "Guardando..." : "Guardar y generar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
