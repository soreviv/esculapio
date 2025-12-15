import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface AllergyAlertProps {
  alergias: string[];
  onDismiss?: () => void;
}

export function AllergyAlert({ alergias, onDismiss }: AllergyAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alergias.length === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div 
      className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-3"
      role="alert"
      data-testid="alert-allergies"
    >
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">
          Alergias conocidas
        </p>
        <p className="text-sm text-destructive/80 mt-1">
          {alergias.join(", ")}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={handleDismiss}
        data-testid="button-dismiss-allergy"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
