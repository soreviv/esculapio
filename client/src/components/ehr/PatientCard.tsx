import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, AlertTriangle, Trash2 } from "lucide-react";

export interface PatientCardProps {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  curp: string;
  fechaNacimiento: string;
  sexo: "M" | "F";
  status: "activo" | "alta" | "en_consulta";
  alergias?: string[];
  onViewRecord?: () => void;
  onSchedule?: () => void;
  onDelete?: () => void;
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function calculateAge(fechaNacimiento: string): number {
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getStatusBadge(status: PatientCardProps["status"]) {
  switch (status) {
    case "activo":
      return <Badge variant="secondary">Activo</Badge>;
    case "alta":
      return <Badge variant="outline">Alta</Badge>;
    case "en_consulta":
      return <Badge className="bg-primary text-primary-foreground">En consulta</Badge>;
  }
}

export function PatientCard({
  nombre,
  apellidoPaterno,
  apellidoMaterno,
  curp,
  fechaNacimiento,
  sexo,
  status,
  alergias = [],
  onViewRecord,
  onSchedule,
  onDelete,
}: PatientCardProps) {
  const fullName = `${nombre} ${apellidoPaterno} ${apellidoMaterno || ""}`;
  const age = calculateAge(fechaNacimiento);

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(nombre, apellidoPaterno)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium truncate" data-testid="text-patient-name">
                {fullName}
              </h3>
              {getStatusBadge(status)}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {age} años | {sexo === "M" ? "Masculino" : "Femenino"}
            </p>
            
            <p className="text-xs font-mono text-muted-foreground mt-1" data-testid="text-patient-curp">
              CURP: {curp}
            </p>

            {alergias.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">
                  Alergias: {alergias.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewRecord}
            data-testid="button-view-record"
          >
            <FileText className="h-4 w-4 mr-2" />
            Expediente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSchedule}
            data-testid="button-schedule"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
