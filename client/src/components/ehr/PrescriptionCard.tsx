import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, Calendar } from "lucide-react";

export interface PrescriptionCardProps {
  medicamento: string;
  presentacion: string;
  dosis: string;
  via: string;
  frecuencia: string;
  duracion: string;
  indicaciones?: string;
  status: "activa" | "completada" | "cancelada";
}

const statusConfig = {
  activa: { label: "Activa", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  completada: { label: "Completada", className: "bg-muted text-muted-foreground" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

export function PrescriptionCard({
  medicamento,
  presentacion,
  dosis,
  via,
  frecuencia,
  duracion,
  indicaciones,
  status,
}: PrescriptionCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className={status === "activa" ? "border-green-200 dark:border-green-800" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">{medicamento}</CardTitle>
              <p className="text-xs text-muted-foreground">{presentacion}</p>
            </div>
          </div>
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Dosis</p>
            <p className="font-medium">{dosis}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vía</p>
            <p className="font-medium">{via}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{frecuencia}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{duracion}</span>
          </div>
        </div>

        {indicaciones && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Indicaciones</p>
            <p className="text-sm">{indicaciones}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
