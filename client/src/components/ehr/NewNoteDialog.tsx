import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FilePlus, Save, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Cie10Search, type DiagnosticoSeleccionado } from "./Cie10Search";

export interface NewNoteDialogProps {
  patientId: string;
  patientNombre?: string;
  medicoId: string;
  onSuccess?: () => void;
}

interface VitalsFormData {
  presionSistolica: string;
  presionDiastolica: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  temperatura: string;
  saturacionOxigeno: string;
  peso: string;
  talla: string;
  glucosa: string;
}

interface NoteFormData {
  tipo: string;
  motivoConsulta: string;
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  pronostico: string;
  diagnosticos: DiagnosticoSeleccionado[];
  vitals: VitalsFormData;
}

const initialVitals: VitalsFormData = {
  presionSistolica: "",
  presionDiastolica: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  temperatura: "",
  saturacionOxigeno: "",
  peso: "",
  talla: "",
  glucosa: "",
};

const initialFormData: NoteFormData = {
  tipo: "",
  motivoConsulta: "",
  subjetivo: "",
  objetivo: "",
  analisis: "",
  plan: "",
  pronostico: "",
  diagnosticos: [],
  vitals: initialVitals,
};

const tiposNota = [
  { value: "nota_evolucion", label: "Nota de Evolución" },
  { value: "nota_inicial", label: "Nota de Primera Vez" },
  { value: "historia_clinica", label: "Historia Clínica" },
  { value: "nota_interconsulta", label: "Interconsulta" },
  { value: "nota_referencia", label: "Nota de Referencia" },
  { value: "nota_egreso", label: "Nota de Egreso" },
];

export function NewNoteDialog({ 
  patientId, 
  patientNombre, 
  medicoId,
  onSuccess 
}: NewNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<NoteFormData>(initialFormData);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validar si se puede firmar
  const canSign = 
    formData.tipo !== "" &&
    formData.diagnosticos.length > 0 &&
    (formData.subjetivo !== "" || formData.objetivo !== "" || formData.analisis !== "" || formData.plan !== "");

  // Mutation para crear nota
  const createNoteMutation = useMutation({
    mutationFn: async (data: { note: any; vitals: any; sign: boolean }) => {
      // Guardar signos vitales si hay alguno
      const hasVitals = Object.values(data.vitals).some((v) => v !== null);
      if (hasVitals) {
        await fetch("/api/vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data.vitals, patientId }),
        });
      }

      // Crear la nota
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.note),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear nota");
      }

      const note = await response.json();

      // Si se debe firmar, hacer la firma
      if (data.sign) {
        const signResponse = await fetch(`/api/notes/${note.id}/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: medicoId }),
        });
        
        if (!signResponse.ok) {
          throw new Error("Error al firmar la nota");
        }
        
        return signResponse.json();
      }
      
      return note;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/notes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vitals`] });
      
      toast({
        title: variables.sign ? "Nota firmada" : "Nota guardada",
        description: variables.sign 
          ? "La nota ha sido firmada electrónicamente y ya no puede ser modificada"
          : "La nota ha sido guardada como borrador",
      });
      
      if (variables.sign) {
        // Cerrar diálogo si se firmó
        setOpen(false);
        setFormData(initialFormData);
        setSavedNoteId(null);
        onSuccess?.();
      } else {
        // Guardar ID para permitir firmar después
        setSavedNoteId(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para firmar nota existente
  const signNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/notes/${noteId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: medicoId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al firmar la nota");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/notes`] });
      
      toast({
        title: "Nota firmada",
        description: "La nota ha sido firmada electrónicamente y ya no puede ser modificada",
      });
      
      setOpen(false);
      setFormData(initialFormData);
      setSavedNoteId(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const prepareNoteData = () => ({
    patientId,
    medicoId,
    tipo: formData.tipo,
    motivoConsulta: formData.motivoConsulta || null,
    padecimientoActual: formData.subjetivo || null,
    subjetivo: formData.subjetivo || null,
    objetivo: formData.objetivo || null,
    analisis: formData.analisis || null,
    plan: formData.plan || null,
    pronostico: formData.pronostico || null,
    diagnoses: formData.diagnosticos.map(d => ({ codigo: d.codigo, tipo: "presuntivo" })),
    fecha: new Date().toISOString(),
  });

  const prepareVitalsData = () => {
    const v = formData.vitals;
    const parsed = {
      presionSistolica: v.presionSistolica ? parseInt(v.presionSistolica) : null,
      presionDiastolica: v.presionDiastolica ? parseInt(v.presionDiastolica) : null,
      frecuenciaCardiaca: v.frecuenciaCardiaca ? parseInt(v.frecuenciaCardiaca) : null,
      frecuenciaRespiratoria: v.frecuenciaRespiratoria ? parseInt(v.frecuenciaRespiratoria) : null,
      temperatura: v.temperatura ? parseFloat(v.temperatura) : null,
      saturacionOxigeno: v.saturacionOxigeno ? parseInt(v.saturacionOxigeno) : null,
      peso: v.peso ? parseFloat(v.peso) : null,
      talla: v.talla ? parseInt(v.talla) : null,
      glucosa: v.glucosa ? parseInt(v.glucosa) : null,
    };
    return parsed;
  };

  const handleSaveDraft = () => {
    if (!formData.tipo) {
      toast({
        title: "Error",
        description: "Seleccione el tipo de nota",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      note: prepareNoteData(),
      vitals: prepareVitalsData(),
      sign: false,
    });
  };

  const handleSignAndSave = () => {
    if (!canSign) {
      toast({
        title: "No se puede firmar",
        description: "Complete los campos requeridos y agregue al menos un diagnóstico CIE-10",
        variant: "destructive",
      });
      return;
    }

    if (savedNoteId) {
      // Firmar nota existente
      signNoteMutation.mutate(savedNoteId);
    } else {
      // Crear y firmar en un paso
      createNoteMutation.mutate({
        note: prepareNoteData(),
        vitals: prepareVitalsData(),
        sign: true,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && savedNoteId) {
      // Advertir si hay borrador sin firmar
      if (confirm("Hay una nota guardada sin firmar. ¿Desea cerrar de todos modos?")) {
        setOpen(false);
        setFormData(initialFormData);
        setSavedNoteId(null);
      }
    } else {
      setOpen(newOpen);
      if (!newOpen) {
        setFormData(initialFormData);
        setSavedNoteId(null);
      }
    }
  };

  const isLoading = createNoteMutation.isPending || signNoteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-note">
          <FilePlus className="h-4 w-4 mr-2" />
          Nueva Nota
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Nota Médica</DialogTitle>
          {patientNombre && (
            <DialogDescription>
              Paciente: <strong>{patientNombre}</strong>
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Tipo de nota y motivo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Nota <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                disabled={isLoading}
              >
                <SelectTrigger data-testid="select-note-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposNota.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de Consulta</Label>
              <Input
                id="motivo"
                value={formData.motivoConsulta}
                onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                placeholder="Ej: Control de diabetes"
                disabled={isLoading}
                data-testid="input-motivo"
              />
            </div>
          </div>

          <Separator />

          {/* Signos Vitales */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Signos Vitales
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Presión arterial (mmHg)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Sistólica"
                    value={formData.vitals.presionSistolica}
                    onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, presionSistolica: e.target.value } })}
                    disabled={isLoading}
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    placeholder="Diastólica"
                    value={formData.vitals.presionDiastolica}
                    onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, presionDiastolica: e.target.value } })}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">FC (lpm)</Label>
                <Input
                  type="number"
                  placeholder="Frec. cardíaca"
                  value={formData.vitals.frecuenciaCardiaca}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, frecuenciaCardiaca: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">FR (rpm)</Label>
                <Input
                  type="number"
                  placeholder="Frec. respiratoria"
                  value={formData.vitals.frecuenciaRespiratoria}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, frecuenciaRespiratoria: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Temperatura (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.6"
                  value={formData.vitals.temperatura}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temperatura: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SpO₂ (%)</Label>
                <Input
                  type="number"
                  placeholder="Saturación O₂"
                  value={formData.vitals.saturacionOxigeno}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, saturacionOxigeno: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Glucosa (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="Glucosa capilar"
                  value={formData.vitals.glucosa}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, glucosa: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Peso"
                  value={formData.vitals.peso}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, peso: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Talla (cm)</Label>
                <Input
                  type="number"
                  placeholder="Talla"
                  value={formData.vitals.talla}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, talla: e.target.value } })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Campos clínicos */}
          <div className="space-y-2">
            <Label htmlFor="subjetivo">Padecimiento Actual</Label>
            <Textarea
              id="subjetivo"
              value={formData.subjetivo}
              onChange={(e) => setFormData({ ...formData, subjetivo: e.target.value })}
              placeholder="Lo que refiere el paciente: síntomas, molestias, evolución..."
              rows={3}
              disabled={isLoading}
              data-testid="textarea-subjetivo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo">Exploración Física</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              placeholder="Hallazgos a la exploración física..."
              rows={3}
              disabled={isLoading}
              data-testid="textarea-objetivo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analisis">Análisis</Label>
            <Textarea
              id="analisis"
              value={formData.analisis}
              onChange={(e) => setFormData({ ...formData, analisis: e.target.value })}
              placeholder="Interpretación clínica, correlación de hallazgos..."
              rows={2}
              disabled={isLoading}
              data-testid="textarea-analisis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Textarea
              id="plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              placeholder="Tratamiento, indicaciones, estudios solicitados, seguimiento..."
              rows={3}
              disabled={isLoading}
              data-testid="textarea-plan"
            />
          </div>

          <Separator />

          {/* Diagnóstico CIE-10 - ÚLTIMO PASO */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <span className="text-base">Diagnóstico(s) CIE-10</span>
              <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                (Requerido para firmar)
              </span>
            </Label>
            <Cie10Search
              value={formData.diagnosticos}
              onChange={(diagnosticos) => setFormData({ ...formData, diagnosticos })}
              placeholder="Buscar por código o descripción (ej: diabetes, E11, hipertensión...)"
              maxDiagnosticos={5}
              disabled={isLoading}
            />
          </div>

          {/* Pronóstico */}
          <div className="space-y-2">
            <Label htmlFor="pronostico">Pronóstico</Label>
            <Select 
              value={formData.pronostico} 
              onValueChange={(v) => setFormData({ ...formData, pronostico: v })}
              disabled={isLoading}
            >
              <SelectTrigger data-testid="select-pronostico">
                <SelectValue placeholder="Seleccionar pronóstico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bueno para la vida y la función">Bueno para la vida y la función</SelectItem>
                <SelectItem value="Bueno para la vida, reservado para la función">Bueno para la vida, reservado para la función</SelectItem>
                <SelectItem value="Reservado para la vida y la función">Reservado para la vida y la función</SelectItem>
                <SelectItem value="Malo para la vida y la función">Malo para la vida y la función</SelectItem>
                <SelectItem value="Reservado a evolución">Reservado a evolución</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerta de firma */}
          {savedNoteId && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Nota guardada como borrador.</strong> Complete los diagnósticos y firme para finalizar.
                Una vez firmada, la nota no podrá ser modificada.
              </AlertDescription>
            </Alert>
          )}

          {canSign && !savedNoteId && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Nota lista para firmar.</strong> Al firmar, la nota quedará registrada de forma permanente
                y no podrá ser modificada (NOM-024-SSA3-2012).
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={isLoading || !formData.tipo}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            {savedNoteId ? "Actualizar borrador" : "Guardar borrador"}
          </Button>
          <Button 
            onClick={handleSignAndSave}
            disabled={isLoading || !canSign}
            className="bg-primary"
            data-testid="button-sign-note"
          >
            <Lock className="h-4 w-4 mr-2" />
            Firmar Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewNoteDialog;
