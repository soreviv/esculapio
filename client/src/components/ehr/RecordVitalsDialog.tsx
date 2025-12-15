import { useState } from "react";
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
import { Activity, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface RecordVitalsDialogProps {
  pacienteNombre?: string;
  onSave?: (data: VitalsFormData) => void;
}

export interface VitalsFormData {
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

export function RecordVitalsDialog({ pacienteNombre, onSave }: RecordVitalsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<VitalsFormData>({
    presionSistolica: "",
    presionDiastolica: "",
    frecuenciaCardiaca: "",
    frecuenciaRespiratoria: "",
    temperatura: "",
    saturacionOxigeno: "",
    peso: "",
    talla: "",
    glucosa: "",
  });

  const handleSave = () => {
    onSave?.(formData);
    toast({
      title: "Signos vitales registrados",
      description: "Los signos vitales han sido guardados correctamente",
    });
    setOpen(false);
    setFormData({
      presionSistolica: "",
      presionDiastolica: "",
      frecuenciaCardiaca: "",
      frecuenciaRespiratoria: "",
      temperatura: "",
      saturacionOxigeno: "",
      peso: "",
      talla: "",
      glucosa: "",
    });
  };

  const updateField = (field: keyof VitalsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-record-vitals">
          <Activity className="h-4 w-4 mr-2" />
          Registrar Signos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Signos Vitales</DialogTitle>
          {pacienteNombre && (
            <DialogDescription>Paciente: {pacienteNombre}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Presión Arterial
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                value={formData.presionSistolica}
                onChange={(e) => updateField("presionSistolica", e.target.value)}
                placeholder="Sistólica"
                className="text-center"
                data-testid="input-presion-sistolica"
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                value={formData.presionDiastolica}
                onChange={(e) => updateField("presionDiastolica", e.target.value)}
                placeholder="Diastólica"
                className="text-center"
                data-testid="input-presion-diastolica"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mmHg</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fc">Frecuencia Cardíaca</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fc"
                  type="number"
                  value={formData.frecuenciaCardiaca}
                  onChange={(e) => updateField("frecuenciaCardiaca", e.target.value)}
                  placeholder="0"
                  data-testid="input-fc"
                />
                <span className="text-sm text-muted-foreground">lpm</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr">Frecuencia Respiratoria</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fr"
                  type="number"
                  value={formData.frecuenciaRespiratoria}
                  onChange={(e) => updateField("frecuenciaRespiratoria", e.target.value)}
                  placeholder="0"
                  data-testid="input-fr"
                />
                <span className="text-sm text-muted-foreground">rpm</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp">Temperatura</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  value={formData.temperatura}
                  onChange={(e) => updateField("temperatura", e.target.value)}
                  placeholder="36.5"
                  data-testid="input-temperatura"
                />
                <span className="text-sm text-muted-foreground">°C</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spo2">Saturación O2</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="spo2"
                  type="number"
                  value={formData.saturacionOxigeno}
                  onChange={(e) => updateField("saturacionOxigeno", e.target.value)}
                  placeholder="98"
                  data-testid="input-spo2"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso">Peso</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => updateField("peso", e.target.value)}
                  placeholder="70"
                  data-testid="input-peso"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="talla">Talla</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="talla"
                  type="number"
                  value={formData.talla}
                  onChange={(e) => updateField("talla", e.target.value)}
                  placeholder="170"
                  data-testid="input-talla"
                />
                <span className="text-sm text-muted-foreground">cm</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="glucosa">Glucosa</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="glucosa"
                  type="number"
                  value={formData.glucosa}
                  onChange={(e) => updateField("glucosa", e.target.value)}
                  placeholder="100"
                  data-testid="input-glucosa"
                />
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} data-testid="button-save-vitals">
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
