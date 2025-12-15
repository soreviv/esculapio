import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, CheckCircle, Clock, Eye } from "lucide-react";

export interface MedicalNoteCardProps {
  id: string;
  tipo: "historia_clinica" | "nota_evolucion" | "nota_egreso" | "interconsulta";
  fecha: string;
  hora: string;
  medicoNombre: string;
  especialidad: string;
  motivoConsulta?: string;
  diagnosticos?: string[];
  firmada: boolean;
  onView?: () => void;
}

const tipoLabels = {
  historia_clinica: "Historia Clínica",
  nota_evolucion: "Nota de Evolución",
  nota_egreso: "Nota de Egreso",
  interconsulta: "Interconsulta",
};

export function MedicalNoteCard({
  tipo,
  fecha,
  hora,
  medicoNombre,
  especialidad,
  motivoConsulta,
  diagnosticos = [],
  firmada,
  onView,
}: MedicalNoteCardProps) {
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
                {tipoLabels[tipo]}
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
                  {dx}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={onView}
          data-testid="button-view-note"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver nota completa
        </Button>
      </CardContent>
    </Card>
  );
}
