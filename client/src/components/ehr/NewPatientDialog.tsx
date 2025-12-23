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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Save, Shield } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export interface NewPatientDialogProps {
  onSave?: (data: PatientFormData) => void;
}

export interface PatientFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  fechaNacimiento: string;
  sexo: string;
  lugarNacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  grupoSanguineo: string;
  alergias: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  consentimientoPrivacidad: boolean;
  consentimientoExpediente: boolean;
}

export function NewPatientDialog({ onSave }: NewPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<PatientFormData>({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    curp: "",
    fechaNacimiento: "",
    sexo: "",
    lugarNacimiento: "",
    telefono: "",
    email: "",
    direccion: "",
    grupoSanguineo: "",
    alergias: "",
    contactoEmergencia: "",
    telefonoEmergencia: "",
    consentimientoPrivacidad: false,
    consentimientoExpediente: false,
  });

  const handleSave = () => {
    if (!formData.nombre || !formData.apellidoPaterno || !formData.curp) {
      toast({
        title: "Error",
        description: "Complete los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!formData.consentimientoPrivacidad || !formData.consentimientoExpediente) {
      toast({
        title: "Consentimiento requerido",
        description: "El paciente debe aceptar el aviso de privacidad y el consentimiento para el expediente electrónico (LFPDPPP)",
        variant: "destructive",
      });
      return;
    }

    onSave?.(formData);
    toast({
      title: "Paciente registrado",
      description: `${formData.nombre} ${formData.apellidoPaterno} ha sido registrado exitosamente`,
    });
    setOpen(false);
    setFormData({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      curp: "",
      fechaNacimiento: "",
      sexo: "",
      lugarNacimiento: "",
      telefono: "",
      email: "",
      direccion: "",
      grupoSanguineo: "",
      alergias: "",
      contactoEmergencia: "",
      telefonoEmergencia: "",
      consentimientoPrivacidad: false,
      consentimientoExpediente: false,
    });
  };

  const updateField = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-patient">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro de Nuevo Paciente</DialogTitle>
          <DialogDescription>
            Ingrese los datos del paciente conforme a la NOM-024
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Datos Personales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre(s) *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  placeholder="Nombre(s)"
                  data-testid="input-nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">Apellido Paterno *</Label>
                <Input
                  id="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => updateField("apellidoPaterno", e.target.value)}
                  placeholder="Apellido paterno"
                  data-testid="input-apellido-paterno"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
                <Input
                  id="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => updateField("apellidoMaterno", e.target.value)}
                  placeholder="Apellido materno"
                  data-testid="input-apellido-materno"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curp">CURP *</Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => updateField("curp", e.target.value.toUpperCase())}
                placeholder="CURP (18 caracteres)"
                maxLength={18}
                className="font-mono uppercase"
                data-testid="input-curp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => updateField("fechaNacimiento", e.target.value)}
                data-testid="input-fecha-nacimiento"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo *</Label>
              <Select value={formData.sexo} onValueChange={(v) => updateField("sexo", v)}>
                <SelectTrigger data-testid="select-sexo">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupoSanguineo">Grupo Sanguíneo</Label>
              <Select value={formData.grupoSanguineo} onValueChange={(v) => updateField("grupoSanguineo", v)}>
                <SelectTrigger data-testid="select-grupo-sanguineo">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lugarNacimiento">Lugar de Nacimiento</Label>
              <Input
                id="lugarNacimiento"
                value={formData.lugarNacimiento}
                onChange={(e) => updateField("lugarNacimiento", e.target.value)}
                placeholder="Estado/Ciudad"
                data-testid="input-lugar-nacimiento"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Contacto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => updateField("telefono", e.target.value)}
                  placeholder="10 dígitos"
                  data-testid="input-telefono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={formData.direccion}
                onChange={(e) => updateField("direccion", e.target.value)}
                placeholder="Calle, número, colonia, código postal, municipio, estado"
                rows={2}
                data-testid="textarea-direccion"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Información Médica
            </h4>
            <div className="space-y-2">
              <Label htmlFor="alergias">Alergias Conocidas</Label>
              <Textarea
                id="alergias"
                value={formData.alergias}
                onChange={(e) => updateField("alergias", e.target.value)}
                placeholder="Medicamentos, alimentos, otros (separar con comas)"
                rows={2}
                data-testid="textarea-alergias"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">
              Contacto de Emergencia
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactoEmergencia">Nombre</Label>
                <Input
                  id="contactoEmergencia"
                  value={formData.contactoEmergencia}
                  onChange={(e) => updateField("contactoEmergencia", e.target.value)}
                  placeholder="Nombre completo"
                  data-testid="input-contacto-emergencia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefonoEmergencia">Teléfono</Label>
                <Input
                  id="telefonoEmergencia"
                  type="tel"
                  value={formData.telefonoEmergencia}
                  onChange={(e) => updateField("telefonoEmergencia", e.target.value)}
                  placeholder="10 dígitos"
                  data-testid="input-telefono-emergencia"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Consentimiento (LFPDPPP) *
            </h4>
            <div className="space-y-4 bg-muted/50 p-4 rounded-md">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentimientoPrivacidad"
                  checked={formData.consentimientoPrivacidad}
                  onCheckedChange={(checked) => 
                    updateField("consentimientoPrivacidad", checked === true)
                  }
                  data-testid="checkbox-privacidad"
                />
                <div className="space-y-1">
                  <Label htmlFor="consentimientoPrivacidad" className="text-sm font-normal cursor-pointer">
                    Acepto el Aviso de Privacidad
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    He leído y acepto el{" "}
                    <Link href="/aviso-privacidad" className="text-primary underline" onClick={() => setOpen(false)}>
                      Aviso de Privacidad
                    </Link>{" "}
                    conforme a la LFPDPPP.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentimientoExpediente"
                  checked={formData.consentimientoExpediente}
                  onCheckedChange={(checked) => 
                    updateField("consentimientoExpediente", checked === true)
                  }
                  data-testid="checkbox-expediente"
                />
                <div className="space-y-1">
                  <Label htmlFor="consentimientoExpediente" className="text-sm font-normal cursor-pointer">
                    Autorizo el expediente clínico electrónico
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Autorizo la creación y manejo de mi expediente clínico electrónico conforme a la NOM-024-SSA3-2012.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} data-testid="button-save-patient">
            <Save className="h-4 w-4 mr-2" />
            Registrar Paciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
