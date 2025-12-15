import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, FileText } from "lucide-react";

export interface AppointmentCardProps {
  id: string;
  pacienteNombre: string;
  hora: string;
  duracion: string;
  motivo?: string;
  status: "pendiente" | "en_curso" | "completada" | "no_asistio";
  onStartConsult?: () => void;
  onViewPatient?: () => void;
}

const statusConfig = {
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  en_curso: { label: "En curso", className: "bg-primary text-primary-foreground" },
  completada: { label: "Completada", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  no_asistio: { label: "No asistió", className: "bg-muted text-muted-foreground" },
};

export function AppointmentCard({
  pacienteNombre,
  hora,
  duracion,
  motivo,
  status,
  onStartConsult,
  onViewPatient,
}: AppointmentCardProps) {
  const statusInfo = statusConfig[status];
  const initials = pacienteNombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Card className={status === "en_curso" ? "border-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-medium truncate">{pacienteNombre}</h4>
              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            </div>
            
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {hora}
              </span>
              <span>{duracion}</span>
            </div>
            
            {motivo && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {motivo}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {status === "pendiente" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onStartConsult}
              data-testid="button-start-consult"
            >
              Iniciar consulta
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={status === "pendiente" ? "" : "flex-1"}
            onClick={onViewPatient}
            data-testid="button-view-patient"
          >
            <User className="h-4 w-4 mr-2" />
            Ver paciente
          </Button>
          {status === "completada" && (
            <Button variant="ghost" size="sm" data-testid="button-view-note-apt">
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
