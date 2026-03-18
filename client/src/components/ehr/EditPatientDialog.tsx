import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

interface EditPatientDialogProps {
  patient: Patient;
  onSuccess?: () => void;
}

export function EditPatientDialog({ patient, onSuccess }: EditPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: patient.nombre,
    apellidoPaterno: patient.apellidoPaterno,
    apellidoMaterno: patient.apellidoMaterno || "",
    telefono: patient.telefono || "",
    email: patient.email || "",
    direccion: patient.direccion || "",
    grupoSanguineo: patient.grupoSanguineo || "",
    alergias: (patient.alergias || []).join(", "),
    contactoEmergencia: patient.contactoEmergencia || "",
    telefonoEmergencia: patient.telefonoEmergencia || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        alergias: data.alergias
          ? data.alergias.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
      };
      const res = await apiRequest("PATCH", `/api/patients/${patient.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Paciente actualizado",
        description: "Los datos han sido guardados correctamente.",
      });
      setOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el paciente.",
        variant: "destructive",
      });
    },
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.apellidoPaterno) {
      toast({
        title: "Error",
        description: "Nombre y apellido paterno son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-edit-patient">
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Datos del Paciente</DialogTitle>
          <DialogDescription>
            Modifique los datos del paciente. CURP y fecha de nacimiento no pueden cambiarse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Datos Personales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre(s) *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellidoPaterno">Apellido Paterno *</Label>
                <Input
                  id="edit-apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => updateField("apellidoPaterno", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellidoMaterno">Apellido Materno</Label>
                <Input
                  id="edit-apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => updateField("apellidoMaterno", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grupo Sanguíneo</Label>
            <Select
              value={formData.grupoSanguineo}
              onValueChange={(v) => updateField("grupoSanguineo", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Contacto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => updateField("telefono", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo Electrónico</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Textarea
                id="edit-direccion"
                value={formData.direccion}
                onChange={(e) => updateField("direccion", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Información Médica
            </h4>
            <div className="space-y-2">
              <Label htmlFor="edit-alergias">Alergias Conocidas (separadas por coma)</Label>
              <Textarea
                id="edit-alergias"
                value={formData.alergias}
                onChange={(e) => updateField("alergias", e.target.value)}
                placeholder="Penicilina, Látex, ..."
                rows={2}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Contacto de Emergencia
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactoEmergencia">Nombre</Label>
                <Input
                  id="edit-contactoEmergencia"
                  value={formData.contactoEmergencia}
                  onChange={(e) => updateField("contactoEmergencia", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefonoEmergencia">Teléfono</Label>
                <Input
                  id="edit-telefonoEmergencia"
                  type="tel"
                  value={formData.telefonoEmergencia}
                  onChange={(e) => updateField("telefonoEmergencia", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
