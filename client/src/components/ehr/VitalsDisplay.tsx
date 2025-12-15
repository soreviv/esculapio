import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Thermometer, Wind, Droplets, Scale } from "lucide-react";

export interface VitalSign {
  label: string;
  value: string | number;
  unit: string;
  icon: "heart" | "thermometer" | "activity" | "wind" | "droplets" | "scale";
  status?: "normal" | "warning" | "critical";
}

export interface VitalsDisplayProps {
  vitals: VitalSign[];
  fechaRegistro?: string;
}

const iconMap = {
  heart: Heart,
  thermometer: Thermometer,
  activity: Activity,
  wind: Wind,
  droplets: Droplets,
  scale: Scale,
};

const statusColors = {
  normal: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  critical: "text-destructive",
};

export function VitalsDisplay({ vitals, fechaRegistro }: VitalsDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg font-medium">Signos Vitales</CardTitle>
          {fechaRegistro && (
            <span className="text-xs text-muted-foreground">{fechaRegistro}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {vitals.map((vital, index) => {
            const Icon = iconMap[vital.icon];
            const statusColor = vital.status ? statusColors[vital.status] : "";
            
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                data-testid={`vital-${vital.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className={`p-2 rounded-md bg-background ${statusColor || 'text-primary'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{vital.label}</p>
                  <p className={`text-lg font-medium ${statusColor}`}>
                    {vital.value}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {vital.unit}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
