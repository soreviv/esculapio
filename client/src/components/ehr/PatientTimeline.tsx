import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Activity,
  Pill,
  Calendar,
  FlaskConical,
  Clock,
  User,
} from "lucide-react";
import { type TimelineEvent } from "@shared/schema";

interface PatientTimelineProps {
  patientId: string;
}

const eventIcons: Record<string, typeof FileText> = {
  nota_medica: FileText,
  vitales: Activity,
  receta: Pill,
  cita: Calendar,
  orden_laboratorio: FlaskConical,
};

const eventColors: Record<string, string> = {
  nota_medica: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  vitales: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  receta: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  cita: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  orden_laboratorio: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const eventLabels: Record<string, string> = {
  nota_medica: "Nota Médica",
  vitales: "Signos Vitales",
  receta: "Receta",
  cita: "Cita",
  orden_laboratorio: "Laboratorio",
};

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const { data: timeline = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/patients", patientId, "timeline"],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/timeline`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error loading timeline");
      return response.json();
    },
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historia Clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historia Clínica
          <Badge variant="secondary" className="ml-auto">
            {timeline.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay eventos registrados para este paciente
          </p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4">
                {timeline.map((event, index) => {
                  const Icon = eventIcons[event.tipo] || FileText;
                  return (
                    <div
                      key={`${event.tipo}-${event.id}-${index}`}
                      className="relative pl-10"
                      data-testid={`timeline-event-${event.id}`}
                    >
                      <div className={`absolute left-2 top-2 rounded-full p-1.5 ${eventColors[event.tipo] || "bg-muted"}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs">
                            {eventLabels[event.tipo] || event.tipo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.fecha)}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{event.titulo}</p>
                        {event.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.descripcion}
                          </p>
                        )}
                        {event.medicoNombre && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {event.medicoNombre}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
