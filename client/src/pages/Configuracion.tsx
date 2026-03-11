import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AuditLog, User as UserRecord } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  Building2,
  Users,
  Clock,
  Palette,
  Database,
  Shield,
  Save,
  Upload,
  Plus,
  Trash2,
  Bell,
  Key,
  FileCheck,
  HardDrive,
  Calendar,
  Download,
  ClipboardList,
  Search,
  RefreshCw,
  User,
  FileText,
  Stethoscope,
  Activity,
  Pill,
  FlaskConical,
} from "lucide-react";

export default function Configuracion() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("establecimiento");
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    nombre: "",
    role: "medico",
    especialidad: "",
    cedula: "",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserRecord[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUserForm) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewUserDialogOpen(false);
      setNewUserForm({ username: "", password: "", nombre: "", role: "medico", especialidad: "", cedula: "" });
      toast({ title: "Usuario creado", description: "El usuario fue registrado exitosamente." });
    },
    onError: (err: Error) => {
      let message = "Error al crear el usuario";
      try {
        const body = JSON.parse(err.message.replace(/^\d+: /, ""));
        message = body.error || message;
      } catch {}
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleSave = (section: string) => {
    toast({
      title: "Configuración guardada",
      description: `Los cambios en ${section} han sido guardados.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Configuración</h1>
          <p className="text-muted-foreground">Administra las opciones del sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="establecimiento" className="data-[state=active]:bg-muted" data-testid="tab-establecimiento">
            <Building2 className="h-4 w-4 mr-2" />
            Establecimiento
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-muted" data-testid="tab-usuarios">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="horarios" className="data-[state=active]:bg-muted" data-testid="tab-horarios">
            <Clock className="h-4 w-4 mr-2" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="personalizacion" className="data-[state=active]:bg-muted" data-testid="tab-personalizacion">
            <Palette className="h-4 w-4 mr-2" />
            Personalización
          </TabsTrigger>
          <TabsTrigger value="respaldos" className="data-[state=active]:bg-muted" data-testid="tab-respaldos">
            <Database className="h-4 w-4 mr-2" />
            Respaldos
          </TabsTrigger>
          <TabsTrigger value="normativa" className="data-[state=active]:bg-muted" data-testid="tab-normativa">
            <Shield className="h-4 w-4 mr-2" />
            NOM-024
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="data-[state=active]:bg-muted" data-testid="tab-auditoria">
            <ClipboardList className="h-4 w-4 mr-2" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="establecimiento" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Datos del Establecimiento Médico
              </CardTitle>
              <CardDescription>
                Información general de la clínica u hospital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreEstablecimiento">Nombre del Establecimiento</Label>
                  <Input 
                    id="nombreEstablecimiento" 
                    placeholder="Clínica San Rafael" 
                    data-testid="input-nombre-establecimiento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón Social</Label>
                  <Input 
                    id="razonSocial" 
                    placeholder="Servicios Médicos San Rafael S.A. de C.V." 
                    data-testid="input-razon-social"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input 
                    id="rfc" 
                    placeholder="SMS123456789" 
                    data-testid="input-rfc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clues">Clave CLUES</Label>
                  <Input 
                    id="clues" 
                    placeholder="DFSSA012345" 
                    data-testid="input-clues"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección Completa</Label>
                <Textarea 
                  id="direccion" 
                  placeholder="Av. Insurgentes Sur 1234, Col. Del Valle, Alcaldía Benito Juárez, CDMX, C.P. 03100"
                  data-testid="input-direccion"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input 
                    id="telefono" 
                    placeholder="(55) 1234-5678" 
                    data-testid="input-telefono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="contacto@clinica.com" 
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sitioWeb">Sitio Web</Label>
                  <Input 
                    id="sitioWeb" 
                    placeholder="www.clinica.com" 
                    data-testid="input-sitio-web"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Logotipo del Establecimiento</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" data-testid="button-upload-logo">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Logo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos: PNG, JPG. Tamaño máximo: 2MB
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("establecimiento")} data-testid="button-save-establecimiento">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                  <CardDescription>
                    Administra médicos, enfermeras y personal administrativo
                  </CardDescription>
                </div>
                <Button data-testid="button-new-user" onClick={() => setIsNewUserDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Cargando usuarios...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay usuarios registrados.</p>
                ) : (
                  users.map((u, idx) => {
                    const initials = u.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const roleLabel = u.role === "medico" ? "Médico" : u.role === "enfermeria" ? "Enfermería" : "Administrador";
                    return (
                      <div key={u.id} className="flex items-center justify-between gap-4 p-4 rounded-md border" data-testid={`user-item-${idx + 1}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium">{u.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {u.cedula ? `Cédula: ${u.cedula}` : u.especialidad || u.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{roleLabel}</Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Roles y Permisos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-md border">
                    <p className="font-medium text-sm">Médico</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Crear notas, recetas, órdenes de laboratorio. Firmar documentos.
                    </p>
                  </div>
                  <div className="p-3 rounded-md border">
                    <p className="font-medium text-sm">Enfermería</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrar signos vitales, ver expedientes, agendar citas.
                    </p>
                  </div>
                  <div className="p-3 rounded-md border">
                    <p className="font-medium text-sm">Administrador</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gestión completa del sistema, usuarios y configuración.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog: Nuevo Usuario */}
          <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="new-nombre">Nombre completo *</Label>
                  <Input
                    id="new-nombre"
                    value={newUserForm.nombre}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej. Dr. Juan Pérez"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-username">Nombre de usuario *</Label>
                  <Input
                    id="new-username"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="Ej. jperez"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">Contraseña *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo score 3/4 en seguridad"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-role">Rol *</Label>
                  <Select
                    value={newUserForm.role}
                    onValueChange={(val) => setNewUserForm((f) => ({ ...f, role: val }))}
                  >
                    <SelectTrigger id="new-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="enfermeria">Enfermería</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-especialidad">Especialidad</Label>
                  <Input
                    id="new-especialidad"
                    value={newUserForm.especialidad}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, especialidad: e.target.value }))}
                    placeholder="Ej. Medicina General"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-cedula">Cédula Profesional</Label>
                  <Input
                    id="new-cedula"
                    value={newUserForm.cedula}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, cedula: e.target.value }))}
                    placeholder="Ej. 12345678"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createUserMutation.mutate(newUserForm)}
                  disabled={createUserMutation.isPending || !newUserForm.username || !newUserForm.password || !newUserForm.nombre}
                >
                  {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Atención
              </CardTitle>
              <CardDescription>
                Configura los horarios de operación del establecimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { dia: "Lunes", inicio: "08:00", fin: "20:00", activo: true },
                  { dia: "Martes", inicio: "08:00", fin: "20:00", activo: true },
                  { dia: "Miércoles", inicio: "08:00", fin: "20:00", activo: true },
                  { dia: "Jueves", inicio: "08:00", fin: "20:00", activo: true },
                  { dia: "Viernes", inicio: "08:00", fin: "20:00", activo: true },
                  { dia: "Sábado", inicio: "09:00", fin: "14:00", activo: true },
                  { dia: "Domingo", inicio: "", fin: "", activo: false },
                ].map((horario, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-md border" data-testid={`horario-${horario.dia.toLowerCase()}`}>
                    <Switch checked={horario.activo} />
                    <span className="w-24 font-medium">{horario.dia}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Input 
                        type="time" 
                        defaultValue={horario.inicio} 
                        disabled={!horario.activo}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input 
                        type="time" 
                        defaultValue={horario.fin} 
                        disabled={!horario.activo}
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Días Festivos / No Laborables
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">25 Dic - Navidad</Badge>
                  <Badge variant="secondary">1 Ene - Año Nuevo</Badge>
                  <Badge variant="secondary">5 Feb - Constitución</Badge>
                  <Badge variant="secondary">21 Mar - Benito Juárez</Badge>
                  <Badge variant="secondary">1 May - Día del Trabajo</Badge>
                  <Badge variant="secondary">16 Sep - Independencia</Badge>
                  <Badge variant="secondary">20 Nov - Revolución</Badge>
                  <Button variant="outline" size="sm" data-testid="button-add-holiday">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("horarios")} data-testid="button-save-horarios">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalizacion" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalización del Sistema
              </CardTitle>
              <CardDescription>
                Ajusta la apariencia y comportamiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Apariencia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tema de Color</Label>
                    <Select defaultValue="azul">
                      <SelectTrigger data-testid="select-tema-color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azul">Azul (Predeterminado)</SelectItem>
                        <SelectItem value="verde">Verde</SelectItem>
                        <SelectItem value="morado">Morado</SelectItem>
                        <SelectItem value="naranja">Naranja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modo Oscuro</Label>
                    <div className="flex items-center gap-2">
                      <Switch data-testid="switch-dark-mode" />
                      <span className="text-sm text-muted-foreground">Activar modo oscuro</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Recordatorios de citas</p>
                      <p className="text-xs text-muted-foreground">Notificar antes de cada cita programada</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-notif-citas" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Alertas de laboratorio</p>
                      <p className="text-xs text-muted-foreground">Notificar cuando lleguen resultados</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-notif-lab" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Alertas de alergias</p>
                      <p className="text-xs text-muted-foreground">Mostrar alertas al recetar medicamentos</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-notif-alergias" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Sonidos del sistema</p>
                      <p className="text-xs text-muted-foreground">Reproducir sonidos en notificaciones</p>
                    </div>
                    <Switch data-testid="switch-sounds" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Formato de Datos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato de Fecha</Label>
                    <Select defaultValue="dd-mm-yyyy">
                      <SelectTrigger data-testid="select-formato-fecha">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd-mm-yyyy">DD/MM/AAAA</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM/DD/AAAA</SelectItem>
                        <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Formato de Hora</Label>
                    <Select defaultValue="24h">
                      <SelectTrigger data-testid="select-formato-hora">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 horas</SelectItem>
                        <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("personalización")} data-testid="button-save-personalizacion">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respaldos" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Respaldos de Información
              </CardTitle>
              <CardDescription>
                Gestiona las copias de seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <HardDrive className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Estado del Sistema</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Último respaldo: 24 de diciembre de 2025, 03:00 hrs
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Espacio utilizado: 2.4 GB de 10 GB
                    </p>
                  </div>
                  <Badge variant="secondary">Saludable</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Respaldos Automáticos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frecuencia</Label>
                    <Select defaultValue="diario">
                      <SelectTrigger data-testid="select-frecuencia-respaldo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diario</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hora de Respaldo</Label>
                    <Input type="time" defaultValue="03:00" data-testid="input-hora-respaldo" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch defaultChecked data-testid="switch-respaldo-automatico" />
                  <Label>Respaldos automáticos activados</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Historial de Respaldos</h4>
                <div className="space-y-2">
                  {[
                    { fecha: "24 Dic 2025, 03:00", tamano: "2.4 GB", estado: "Completado" },
                    { fecha: "23 Dic 2025, 03:00", tamano: "2.3 GB", estado: "Completado" },
                    { fecha: "22 Dic 2025, 03:00", tamano: "2.3 GB", estado: "Completado" },
                    { fecha: "21 Dic 2025, 03:00", tamano: "2.2 GB", estado: "Completado" },
                  ].map((respaldo, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 p-3 rounded-md border" data-testid={`respaldo-${index}`}>
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{respaldo.fecha}</p>
                          <p className="text-xs text-muted-foreground">{respaldo.tamano}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{respaldo.estado}</Badge>
                        <Button size="icon" variant="ghost" data-testid={`button-download-respaldo-${index}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" data-testid="button-restore">
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Respaldo
                </Button>
                <Button data-testid="button-backup-now">
                  <Database className="h-4 w-4 mr-2" />
                  Respaldar Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="normativa" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Parámetros NOM-024-SSA3-2012
              </CardTitle>
              <CardDescription>
                Configuración de cumplimiento normativo para expedientes clínicos electrónicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Sistema en Cumplimiento</p>
                    <p className="text-sm text-muted-foreground">
                      Todas las funcionalidades cumplen con la NOM-024-SSA3-2012
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Firma Electrónica
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Firma obligatoria en notas médicas</p>
                      <p className="text-xs text-muted-foreground">Requerir firma electrónica al cerrar notas</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-firma-obligatoria" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Algoritmo de firma</p>
                      <p className="text-xs text-muted-foreground">SHA-256 para garantizar integridad</p>
                    </div>
                    <Badge variant="secondary">SHA-256</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Sello de tiempo</p>
                      <p className="text-xs text-muted-foreground">Incluir fecha y hora en cada firma</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-sello-tiempo" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Retención de Datos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiempo de retención de expedientes</Label>
                    <Select defaultValue="5">
                      <SelectTrigger data-testid="select-retencion">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 años (mínimo NOM-004)</SelectItem>
                        <SelectItem value="10">10 años</SelectItem>
                        <SelectItem value="15">15 años</SelectItem>
                        <SelectItem value="permanente">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      La NOM-004-SSA3-2012 establece un mínimo de 5 años
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Retención de auditoría</Label>
                    <Select defaultValue="permanente">
                      <SelectTrigger data-testid="select-retencion-auditoria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 años</SelectItem>
                        <SelectItem value="10">10 años</SelectItem>
                        <SelectItem value="permanente">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Registros de trazabilidad del sistema
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Auditoría y Trazabilidad</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Registro de accesos</p>
                      <p className="text-xs text-muted-foreground">Guardar historial de inicio de sesión</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-registro-accesos" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Registro de modificaciones</p>
                      <p className="text-xs text-muted-foreground">Auditar cambios en expedientes</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-registro-modificaciones" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Registro de impresiones</p>
                      <p className="text-xs text-muted-foreground">Auditar documentos impresos</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-registro-impresiones" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("normativa")} data-testid="button-save-normativa">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <AuditLogTab />
      </Tabs>
    </div>
  );
}

function AuditLogTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("all");

  const { data: auditLogs = [], isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", 100],
  });

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "patient":
        return <User className="h-4 w-4" />;
      case "medical_note":
        return <FileText className="h-4 w-4" />;
      case "vitals":
        return <Activity className="h-4 w-4" />;
      case "prescription":
        return <Pill className="h-4 w-4" />;
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "lab_order":
        return <FlaskConical className="h-4 w-4" />;
      default:
        return <Stethoscope className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Crear</Badge>;
      case "update":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Actualizar</Badge>;
      case "delete":
        return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Eliminar</Badge>;
      case "sign":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Firmar</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getEntityName = (entity: string) => {
    const names: Record<string, string> = {
      patient: "Paciente",
      medical_note: "Nota Médica",
      vitals: "Signos Vitales",
      prescription: "Receta",
      appointment: "Cita",
      lab_order: "Orden Lab.",
    };
    return names[entity] || entity;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      (log.detalles?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesEntity = filterEntity === "all" || log.entidad === filterEntity;
    return matchesSearch && matchesEntity;
  });

  return (
    <TabsContent value="auditoria" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Registros de Auditoría
              </CardTitle>
              <CardDescription>
                Historial de accesos y modificaciones del sistema (NOM-024)
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-logs">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descripción o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-logs"
                />
              </div>
            </div>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-entity">
                <SelectValue placeholder="Filtrar por entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las entidades</SelectItem>
                <SelectItem value="patient">Pacientes</SelectItem>
                <SelectItem value="medical_note">Notas Médicas</SelectItem>
                <SelectItem value="vitals">Signos Vitales</SelectItem>
                <SelectItem value="prescription">Recetas</SelectItem>
                <SelectItem value="appointment">Citas</SelectItem>
                <SelectItem value="lab_order">Órdenes de Lab.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando registros...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros de auditoría
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-3 rounded-md border"
                    data-testid={`audit-log-${log.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {getEntityIcon(log.entidad)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.detalles || `${log.accion} en ${log.entidad}`}</span>
                        {getActionBadge(log.accion)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userId || "Sistema"}
                        </span>
                        <span>{getEntityName(log.entidad)} #{log.entidadId}</span>
                        <span>
                          {format(new Date(log.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>Total: {filteredLogs.length} registros</span>
            <span>Mostrando últimos 100 registros</span>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
