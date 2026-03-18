import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, Clock, Eye, Printer, FilePlus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface MedicalNoteCardProps {
  id: string;
  tipo: string;
  fecha: string;
  hora: string;
  medicoNombre: string;
  especialidad?: string;
  motivoConsulta?: string;
  diagnosticos?: (string | { codigo: string; descripcion: string })[];
  firmada: boolean;
  onView?: () => void;
  onPrint?: () => void;
}

const tipoLabels: Record<string, string> = {
  historia_clinica: "Historia Clínica",
  nota_inicial: "Nota de Primera Vez",
  nota_evolucion: "Nota de Evolución",
  nota_interconsulta: "Interconsulta",
  nota_referencia: "Nota de Referencia",
  nota_ingreso: "Nota de Ingreso",
  nota_preoperatoria: "Nota Preoperatoria",
  nota_postoperatoria: "Nota Postoperatoria",
  nota_preanestesica: "Nota Preanestésica",
  nota_egreso: "Nota de Egreso",
  interconsulta: "Interconsulta", // Backward compatibility
};

export function MedicalNoteCard({
  id,
  tipo,
  fecha,
  hora,
  medicoNombre,
  especialidad,
  motivoConsulta,
  diagnosticos = [],
  firmada,
  onView,
  onPrint,
}: MedicalNoteCardProps) {
  const [addendumOpen, setAddendumOpen] = useState(false);
  const [addendumText, setAddendumText] = useState("");
  const { toast } = useToast();

  const addendumMutation = useMutation({
    mutationFn: async (contenido: string) => {
      const res = await apiRequest("POST", `/api/notes/${id}/addendums`, { contenido });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Addendum registrado",
        description: "El anexo ha sido agregado a la nota médica.",
      });
      setAddendumOpen(false);
      setAddendumText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar el addendum.",
        variant: "destructive",
      });
    },
  });

  const renderDiagnosis = (dx: string | { codigo: string; descripcion: string }) => {
    if (typeof dx === 'string') return dx;
    return `${dx.codigo} ${dx.descripcion}`;
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">
                {tipoLabels[tipo] || tipo.replace(/_/g, ' ')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {fecha} - {hora}
              </p>
            </div>
          </div>
          {firmada ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Firmada
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <Clock className="h-3 w-3 mr-1" />
              Pendiente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-muted">
              {medicoNombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{medicoNombre}</p>
            <p className="text-xs text-muted-foreground">{especialidad}</p>
          </div>
        </div>

        {motivoConsulta && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Motivo de consulta
            </p>
            <p className="text-sm mt-1">{motivoConsulta}</p>
          </div>
        )}

        {diagnosticos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Diagnósticos
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {diagnosticos.map((dx, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {renderDiagnosis(dx)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onView}
            data-testid="button-view-note"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver nota completa
          </Button>
          {firmada && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddendumOpen(true)}
              data-testid="button-add-addendum"
              title="Agregar addendum a nota firmada"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          )}
          {onPrint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrint}
              data-testid="button-print-note"
              title="Imprimir / Guardar PDF"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={addendumOpen} onOpenChange={setAddendumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Addendum</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="addendum-contenido">
              Contenido del addendum (NOM-024 — anexo a nota firmada)
            </Label>
            <Textarea
              id="addendum-contenido"
              value={addendumText}
              onChange={(e) => setAddendumText(e.target.value)}
              placeholder="Describa la información adicional o corrección..."
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddendumOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => addendumMutation.mutate(addendumText)}
              disabled={!addendumText.trim() || addendumMutation.isPending}
              data-testid="button-save-addendum"
            >
              <Save className="h-4 w-4 mr-2" />
              {addendumMutation.isPending ? "Guardando..." : "Guardar Addendum"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
