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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FilePlus, Save, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface NewNoteDialogProps {
  pacienteNombre?: string;
  onSave?: (data: NoteFormData) => void;
}

export interface NoteFormData {
  tipo: string;
  motivoConsulta: string;
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  diagnosticos: string;
}

export function NewNoteDialog({ pacienteNombre, onSave }: NewNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<NoteFormData>({
    tipo: "",
    motivoConsulta: "",
    subjetivo: "",
    objetivo: "",
    analisis: "",
    plan: "",
    diagnosticos: "",
  });

  const handleSave = (firmar: boolean) => {
    if (!formData.tipo) {
      toast({
        title: "Error",
        description: "Seleccione el tipo de nota",
        variant: "destructive",
      });
      return;
    }
    
    onSave?.(formData);
    toast({
      title: firmar ? "Nota firmada" : "Nota guardada",
      description: firmar 
        ? "La nota ha sido firmada electrónicamente" 
        : "La nota ha sido guardada como borrador",
    });
    setOpen(false);
    setFormData({
      tipo: "",
      motivoConsulta: "",
      subjetivo: "",
      objetivo: "",
      analisis: "",
      plan: "",
      diagnosticos: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-note">
          <FilePlus className="h-4 w-4 mr-2" />
          Nueva Nota
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Nota Médica</DialogTitle>
          {pacienteNombre && (
            <DialogDescription>
              Paciente: {pacienteNombre}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Nota *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger data-testid="select-note-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nota_evolucion">Nota de Evolución</SelectItem>
                  <SelectItem value="historia_clinica">Historia Clínica</SelectItem>
                  <SelectItem value="nota_egreso">Nota de Egreso</SelectItem>
                  <SelectItem value="interconsulta">Interconsulta</SelectItem>
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
                data-testid="input-motivo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjetivo">Subjetivo (S)</Label>
            <Textarea
              id="subjetivo"
              value={formData.subjetivo}
              onChange={(e) => setFormData({ ...formData, subjetivo: e.target.value })}
              placeholder="Síntomas referidos por el paciente..."
              rows={3}
              data-testid="textarea-subjetivo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo (O)</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              placeholder="Hallazgos de la exploración física..."
              rows={3}
              data-testid="textarea-objetivo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analisis">Análisis (A)</Label>
            <Textarea
              id="analisis"
              value={formData.analisis}
              onChange={(e) => setFormData({ ...formData, analisis: e.target.value })}
              placeholder="Interpretación clínica..."
              rows={2}
              data-testid="textarea-analisis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosticos">Diagnósticos (CIE-10)</Label>
            <Input
              id="diagnosticos"
              value={formData.diagnosticos}
              onChange={(e) => setFormData({ ...formData, diagnosticos: e.target.value })}
              placeholder="Ej: E11.9 Diabetes mellitus tipo 2"
              data-testid="input-diagnosticos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan (P)</Label>
            <Textarea
              id="plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              placeholder="Tratamiento, indicaciones, seguimiento..."
              rows={3}
              data-testid="textarea-plan"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar borrador
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            data-testid="button-sign-note"
          >
            <Send className="h-4 w-4 mr-2" />
            Firmar y guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
