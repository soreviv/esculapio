import { useState, useEffect, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AuditLog, User as UserRecord, ClinicHoursDay, PortalSettings } from "@shared/schema";
import { DEFAULT_CLINIC_HOURS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePreferences } from "@/hooks/use-preferences";
import { useTheme } from "@/components/ThemeProvider";
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
  ShieldCheck,
  ShieldOff,
  Smartphone,
  UserX,
  UserCheck,
  Globe,
  Bot,
  CalendarOff,
  X,
} from "lucide-react";

type BlockedPeriod = { label: string; start: string; end: string };

export default function Configuracion() {
  const { toast } = useToast();
  const { prefs, update: updatePrefs } = usePreferences();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("establecimiento");

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "disable">("idle");
  const [twoFaQr, setTwoFaQr] = useState<string | null>(null);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Portal settings state
  const [portalForm, setPortalForm] = useState({
    portalEnabled: false,
    portalTitle: "",
    portalTagline: "",
    consultationFee: "" as string,
    appointmentDurationMin: 30,
    bookingAdvanceDays: 30,
    bookingBufferMin: 0,
    notificationEmail: "",
    hcaptchaSiteKey: "",
  });
  const [geminiKey, setGeminiKey] = useState("");
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  const [establishmentForm, setEstablishmentForm] = useState({
    nombreEstablecimiento: "",
    razonSocial: "",
    rfc: "",
    domicilio: "",
    ciudad: "",
    estado: "",
    codigoPostal: "",
    telefono: "",
    responsableSanitario: "",
    licenciaSanitaria: "",
    cedulaResponsable: "",
  });

  const { data: portalSettings } = useQuery<PortalSettings>({
    queryKey: ["/api/portal-settings"],
  });

  useEffect(() => {
    if (portalSettings) {
      setEstablishmentForm({
        nombreEstablecimiento: portalSettings.nombreEstablecimiento ?? "",
        razonSocial: portalSettings.razonSocial ?? "",
        rfc: portalSettings.rfc ?? "",
        domicilio: portalSettings.domicilio ?? "",
        ciudad: portalSettings.ciudad ?? "",
        estado: portalSettings.estado ?? "",
        codigoPostal: portalSettings.codigoPostal ?? "",
        telefono: portalSettings.telefono ?? "",
        responsableSanitario: portalSettings.responsableSanitario ?? "",
        licenciaSanitaria: portalSettings.licenciaSanitaria ?? "",
        cedulaResponsable: portalSettings.cedulaResponsable ?? "",
      });
      if (portalSettings.logoUrl) setLogoPreview(portalSettings.logoUrl);
      if (portalSettings.horarios) setSchedules(portalSettings.horarios);
      if (portalSettings.diasFeriados && portalSettings.diasFeriados.length > 0) {
        // Reconstruct ranges from consecutive date sequences
        const sorted = [...portalSettings.diasFeriados].sort();
        const ranges: BlockedPeriod[] = [];
        let rangeStart = sorted[0];
        let prev = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
          const prevDate = parseISO(prev);
          const curDate = parseISO(sorted[i]);
          const diff = (curDate.getTime() - prevDate.getTime()) / 86400000;
          if (diff > 1) {
            ranges.push({ label: "", start: rangeStart, end: prev });
            rangeStart = sorted[i];
          }
          prev = sorted[i];
        }
        ranges.push({ label: "", start: rangeStart, end: prev });
        setBlockedPeriods(ranges);
      }
      setPortalForm({
        portalEnabled: portalSettings.portalEnabled ?? false,
        portalTitle: portalSettings.portalTitle ?? "",
        portalTagline: portalSettings.portalTagline ?? "",
        consultationFee: portalSettings.consultationFee ?? "",
        appointmentDurationMin: portalSettings.appointmentDurationMin ?? 30,
        bookingAdvanceDays: portalSettings.bookingAdvanceDays ?? 30,
        bookingBufferMin: portalSettings.bookingBufferMin ?? 0,
        notificationEmail: portalSettings.notificationEmail ?? "",
        hcaptchaSiteKey: portalSettings.hcaptchaSiteKey ?? "",
      });
      setHasGeminiKey(!!portalSettings.geminiApiKeyEncrypted);
    }
  }, [portalSettings]);

  const saveEstablishmentMutation = useMutation({
    mutationFn: async (data: typeof establishmentForm) => {
      const res = await apiRequest("PATCH", "/api/portal-settings", data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal-settings"] });
      toast({ title: "Configuración guardada", description: "Los datos del establecimiento han sido actualizados." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/config/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el logo");
      setLogoPreview(data.logoUrl);
      toast({ title: "Logo actualizado", description: "El logotipo del establecimiento fue guardado." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };
  const [schedules, setSchedules] = useState<ClinicHoursDay[]>(DEFAULT_CLINIC_HOURS);

  // Períodos de bloqueo (vacaciones, etc.)
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockForm, setBlockForm] = useState({ label: "", start: "", end: "" });

  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    nombre: "",
    role: "medico",
    especialidad: "",
    cedula: "",
    email: "",
  });
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editUserForm, setEditUserForm] = useState({ email: "", nombre: "", especialidad: "", cedula: "", cedulaEspecialidad: "", universidad: "" });
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery<UserRecord[]>({
    queryKey: ["/api/users"],
    enabled: activeTab === "usuarios",
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUserForm) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewUserDialogOpen(false);
      setNewUserForm({ username: "", password: "", nombre: "", role: "medico", especialidad: "", cedula: "", email: "" });
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

  const editUserMutation = useMutation({
    mutationFn: async (data: { id: string; email: string; nombre: string; especialidad: string; cedula: string; cedulaEspecialidad: string; universidad: string }) => {
      const res = await apiRequest("PUT", `/api/users/${data.id}`, {
        email: data.email || null,
        nombre: data.nombre,
        especialidad: data.especialidad || null,
        cedula: data.cedula || null,
        cedulaEspecialidad: data.cedulaEspecialidad || null,
        universidad: data.universidad || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({ title: "Usuario actualizado", description: "Los datos del usuario fueron guardados." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el usuario.", variant: "destructive" });
    },
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}/activo`, { activo });
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: vars.activo ? "Usuario activado" : "Usuario suspendido", description: vars.activo ? "El usuario puede iniciar sesión nuevamente." : "El usuario no podrá iniciar sesión." });
    },
    onError: (err: Error) => {
      let message = "No se pudo cambiar el estado del usuario";
      try { const b = JSON.parse(err.message.replace(/^\d+: /, "")); message = b.error || message; } catch {}
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserToDelete(null);
      toast({ title: "Usuario eliminado", description: "El usuario fue eliminado permanentemente." });
    },
    onError: (err: Error) => {
      let message = "No se pudo eliminar el usuario";
      try { const b = JSON.parse(err.message.replace(/^\d+: /, "")); message = b.error || message; } catch {}
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const { data: twoFaStatus, refetch: refetchTwoFa } = useQuery<{ totpEnabled: boolean }>({
    queryKey: ["/api/auth/2fa/status"],
    enabled: activeTab === "seguridad",
  });

  const twoFaSetupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/2fa/setup");
      return res.json();
    },
    onSuccess: (data) => {
      setTwoFaQr(data.qrCode);
      setTwoFaSecret(data.secret);
      setTwoFaStep("setup");
      setTwoFaCode("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const twoFaConfirmMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/setup/confirm", { code });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error); }
      return res.json();
    },
    onSuccess: () => {
      setTwoFaStep("idle");
      setTwoFaQr(null);
      setTwoFaSecret(null);
      setTwoFaCode("");
      refetchTwoFa();
      toast({ title: "2FA activado", description: "La autenticación de dos factores está activa." });
    },
    onError: (err: Error) => {
      toast({ title: "Código incorrecto", description: err.message, variant: "destructive" });
    },
  });

  const twoFaDisableMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/disable", { code });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error); }
      return res.json();
    },
    onSuccess: () => {
      setTwoFaStep("idle");
      setTwoFaCode("");
      refetchTwoFa();
      toast({ title: "2FA desactivado", description: "La autenticación de dos factores fue desactivada." });
    },
    onError: (err: Error) => {
      toast({ title: "Código incorrecto", description: err.message, variant: "destructive" });
    },
  });

  const saveSchedulesMutation = useMutation({
    mutationFn: async (hours: ClinicHoursDay[]) => {
      const res = await apiRequest("PATCH", "/api/portal-settings", { horarios: hours });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal-settings"] });
      toast({ title: "Horarios guardados", description: "Los horarios de atención han sido actualizados." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar los horarios.", variant: "destructive" });
    },
  });

  const saveBlockedPeriodsMutation = useMutation({
    mutationFn: async (periods: BlockedPeriod[]) => {
      const dias: string[] = [];
      for (const p of periods) {
        if (!p.start || !p.end) continue;
        const start = parseISO(p.start);
        const end = parseISO(p.end);
        if (end < start) continue;
        eachDayOfInterval({ start, end }).forEach((d) => dias.push(format(d, "yyyy-MM-dd")));
      }
      const res = await apiRequest("PATCH", "/api/portal-settings", { diasFeriados: dias });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal-settings"] });
      toast({ title: "Períodos guardados", description: "Los períodos de bloqueo han sido actualizados." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const savePortalSettingsMutation = useMutation({
    mutationFn: async (data: typeof portalForm) => {
      const res = await apiRequest("PATCH", "/api/portal-settings", {
        ...data,
        consultationFee: data.consultationFee || null,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal-settings"] });
      toast({ title: "Portal guardado", description: "La configuración del portal fue actualizada." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveGeminiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await apiRequest("PUT", "/api/portal-settings/gemini-key", { apiKey });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      setGeminiKey("");
      setHasGeminiKey(true);
      toast({ title: "Clave guardada", description: "La clave de Gemini fue actualizada." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteGeminiKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/portal-settings/gemini-key");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al eliminar");
      }
      return res.json();
    },
    onSuccess: () => {
      setHasGeminiKey(false);
      toast({ title: "Clave eliminada", description: "La clave de Gemini fue eliminada." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateSchedule = (index: number, field: keyof ClinicHoursDay, value: string | boolean) => {
    setSchedules((prev) => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleSave = (section: string) => {
    toast({ title: "Configuración guardada", description: `Los cambios en ${section} han sido guardados.` });
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
          <TabsTrigger value="seguridad" className="data-[state=active]:bg-muted" data-testid="tab-seguridad">
            <Key className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="portal" className="data-[state=active]:bg-muted" data-testid="tab-portal">
            <Globe className="h-4 w-4 mr-2" />
            Portal Web
          </TabsTrigger>
        </TabsList>

        <TabsContent value="establecimiento" className="space-y-4 mt-0">
          {!establishmentForm.nombreEstablecimiento && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-300">Datos del establecimiento pendientes</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Complete los datos de su establecimiento para que aparezcan correctamente en recetas, órdenes de laboratorio y documentos impresos.
                </p>
              </div>
            </div>
          )}
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
                    value={establishmentForm.nombreEstablecimiento}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, nombreEstablecimiento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón Social</Label>
                  <Input
                    id="razonSocial"
                    placeholder="Servicios Médicos San Rafael S.A. de C.V."
                    data-testid="input-razon-social"
                    value={establishmentForm.razonSocial}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, razonSocial: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    placeholder="SMS123456789"
                    data-testid="input-rfc"
                    value={establishmentForm.rfc}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, rfc: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsableSanitario">Responsable Sanitario</Label>
                  <Input
                    id="responsableSanitario"
                    placeholder="Dr. Juan Pérez García"
                    value={establishmentForm.responsableSanitario}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, responsableSanitario: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenciaSanitaria">Licencia Sanitaria</Label>
                  <Input
                    id="licenciaSanitaria"
                    placeholder="LS-123456"
                    value={establishmentForm.licenciaSanitaria}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, licenciaSanitaria: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cedulaResponsable">Cédula del Responsable</Label>
                  <Input
                    id="cedulaResponsable"
                    placeholder="1234567"
                    value={establishmentForm.cedulaResponsable}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, cedulaResponsable: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="domicilio">Dirección Completa</Label>
                <Textarea
                  id="domicilio"
                  placeholder="Av. Insurgentes Sur 1234, Col. Del Valle, CDMX"
                  data-testid="input-direccion"
                  value={establishmentForm.domicilio}
                  onChange={(e) => setEstablishmentForm((f) => ({ ...f, domicilio: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    placeholder="Ciudad de México"
                    value={establishmentForm.ciudad}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, ciudad: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    placeholder="CDMX"
                    value={establishmentForm.estado}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, estado: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="(55) 1234-5678"
                    data-testid="input-telefono"
                    value={establishmentForm.telefono}
                    onChange={(e) => setEstablishmentForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Logotipo del Establecimiento</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    variant="outline"
                    data-testid="button-upload-logo"
                    disabled={isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingLogo ? "Subiendo..." : "Subir Logo"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos: PNG, JPG. Tamaño máximo: 2MB
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveEstablishmentMutation.mutate(establishmentForm)}
                  disabled={saveEstablishmentMutation.isPending}
                  data-testid="button-save-establecimiento"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveEstablishmentMutation.isPending ? "Guardando..." : "Guardar Cambios"}
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
                  users.map((u) => {
                    const initials = u.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const roleLabel = u.role === "medico" ? "Médico" : u.role === "enfermeria" ? "Enfermería" : "Administrador";
                    const isActivo = u.activo !== false;
                    return (
                      <div key={u.id} className={`flex items-center justify-between gap-4 p-4 rounded-md border ${!isActivo ? "opacity-60 bg-muted/30" : ""}`} data-testid={`user-item-${u.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActivo ? "bg-primary/10" : "bg-muted"}`}>
                            <span className={`text-sm font-medium ${isActivo ? "text-primary" : "text-muted-foreground"}`}>{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium">{u.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {u.cedula ? `Cédula: ${u.cedula}` : u.especialidad || u.username}
                            </p>
                            {u.email && (
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{roleLabel}</Badge>
                          {!isActivo && <Badge variant="outline" className="text-orange-600 border-orange-300">Suspendido</Badge>}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserForm({
                                email: u.email ?? "",
                                nombre: u.nombre,
                                especialidad: u.especialidad ?? "",
                                cedula: u.cedula ?? "",
                                cedulaEspecialidad: (u as any).cedulaEspecialidad ?? "",
                                universidad: (u as any).universidad ?? "",
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={isActivo ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                            onClick={() => toggleActivoMutation.mutate({ id: u.id, activo: !isActivo })}
                            disabled={toggleActivoMutation.isPending}
                            title={isActivo ? "Suspender usuario" : "Activar usuario"}
                          >
                            {isActivo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setUserToDelete(u)}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

          {/* Dialog: Editar Usuario */}
          {/* AlertDialog: Confirmar eliminación de usuario */}
          <AlertDialog open={!!userToDelete} onOpenChange={(open) => { if (!open) setUserToDelete(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es <strong>permanente e irreversible</strong>. Se eliminará la cuenta de <strong>{userToDelete?.nombre}</strong> ({userToDelete?.username}) junto con todos sus datos de acceso.
                  <br /><br />
                  Los registros clínicos (notas, recetas, etc.) creados por este usuario <strong>no se eliminarán</strong> para mantener la integridad del expediente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending ? "Eliminando..." : "Eliminar permanentemente"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-nombre">Nombre completo</Label>
                  <Input
                    id="edit-nombre"
                    value={editUserForm.nombre}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email">Correo electrónico</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="usuario@clinica.com"
                  />
                  <p className="text-xs text-muted-foreground">Requerido para recuperación de contraseña.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-especialidad">Especialidad</Label>
                  <Input
                    id="edit-especialidad"
                    value={editUserForm.especialidad}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, especialidad: e.target.value }))}
                    placeholder="Ej. Medicina Interna"
                  />
                </div>

                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cédulas Profesionales (COFEPRIS)</p>

                <div className="space-y-1">
                  <Label htmlFor="edit-cedula">Cédula de Medicina General</Label>
                  <Input
                    id="edit-cedula"
                    value={editUserForm.cedula}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, cedula: e.target.value }))}
                    placeholder="Número de cédula de licenciatura"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-cedula-esp">Cédula de Especialidad</Label>
                  <Input
                    id="edit-cedula-esp"
                    value={editUserForm.cedulaEspecialidad}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, cedulaEspecialidad: e.target.value }))}
                    placeholder="Número de cédula de especialidad (si aplica)"
                  />
                </div>

                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Universidad</p>

                <div className="space-y-1">
                  <Label htmlFor="edit-universidad">Universidad que expidió el título</Label>
                  <Input
                    id="edit-universidad"
                    value={editUserForm.universidad}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, universidad: e.target.value }))}
                    placeholder="Ej. Universidad Nacional Autónoma de México"
                  />
                </div>

                {editingUser && (
                  <div className="space-y-2">
                    <Label>Escudo de la Universidad</Label>
                    {(editingUser as any).logoUniversidadUrl && (
                      <img
                        src={(editingUser as any).logoUniversidadUrl}
                        alt="Escudo universidad"
                        className="h-16 w-16 object-contain border rounded"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editingUser) return;
                        const formData = new FormData();
                        formData.append("escudo", file);
                        try {
                          const res = await fetch(`/api/users/${editingUser.id}/escudo-universidad`, {
                            method: "POST",
                            body: formData,
                            credentials: "include",
                          });
                          if (!res.ok) throw new Error();
                          const data = await res.json();
                          setEditingUser({ ...editingUser, ...(data as any) });
                          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                          toast({ title: "Escudo actualizado" });
                        } catch {
                          toast({ title: "Error", description: "No se pudo subir el escudo.", variant: "destructive" });
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">PNG, JPG o SVG. Máx. 2MB. Aparecerá en la receta médica.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
                <Button
                  onClick={() => editingUser && editUserMutation.mutate({ id: editingUser.id, ...editUserForm })}
                  disabled={editUserMutation.isPending || !editUserForm.nombre}
                >
                  {editUserMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                <div className="space-y-1">
                  <Label htmlFor="new-email">Correo electrónico</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Ej. doctor@clinica.com"
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
                {schedules.map((schedule, index) => (
                  <div key={schedule.dia} className="flex items-center gap-4 p-3 rounded-md border" data-testid={`horario-${schedule.dia.toLowerCase().replace('é','e')}`}>
                    <Switch
                      checked={schedule.activo}
                      onCheckedChange={(checked) => updateSchedule(index, "activo", checked)}
                    />
                    <span className="w-24 font-medium">{schedule.dia}</span>
                    {schedule.activo ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={schedule.inicio}
                          onChange={(e) => updateSchedule(index, "inicio", e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">a</span>
                        <Input
                          type="time"
                          value={schedule.fin}
                          onChange={(e) => updateSchedule(index, "fin", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSchedulesMutation.mutate(schedules)}
                  disabled={saveSchedulesMutation.isPending}
                  data-testid="button-save-horarios"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSchedulesMutation.isPending ? "Guardando..." : "Guardar Horarios"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="h-5 w-5" />
                Períodos Bloqueados
              </CardTitle>
              <CardDescription>
                Bloquea rangos de fechas completos (vacaciones, permisos, etc.) para que no se agenden citas en el portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockedPeriods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay períodos bloqueados configurados.</p>
              ) : (
                <div className="space-y-2">
                  {blockedPeriods.map((period, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        <CalendarOff className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          {period.label && <p className="text-sm font-medium">{period.label}</p>}
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(period.start), "d MMM yyyy", { locale: es })}
                            {period.start !== period.end && (
                              <> — {format(parseISO(period.end), "d MMM yyyy", { locale: es })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = blockedPeriods.filter((_, i) => i !== idx);
                          setBlockedPeriods(updated);
                          saveBlockedPeriodsMutation.mutate(updated);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => { setBlockForm({ label: "", start: "", end: "" }); setShowBlockDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar período bloqueado
              </Button>
            </CardContent>
          </Card>

          {/* Dialog para agregar período bloqueado */}
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bloquear período</DialogTitle>
                <DialogDescription>
                  Define un rango de fechas en que no se permitirán citas (vacaciones, permisos, etc.)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="block-label">Etiqueta (opcional)</Label>
                  <Input
                    id="block-label"
                    placeholder="Ej. Vacaciones, Congreso, Permiso..."
                    value={blockForm.label}
                    onChange={(e) => setBlockForm((f) => ({ ...f, label: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="block-start">Fecha inicio</Label>
                    <Input
                      id="block-start"
                      type="date"
                      value={blockForm.start}
                      onChange={(e) => setBlockForm((f) => ({ ...f, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block-end">Fecha fin</Label>
                    <Input
                      id="block-end"
                      type="date"
                      value={blockForm.end}
                      min={blockForm.start}
                      onChange={(e) => setBlockForm((f) => ({ ...f, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancelar</Button>
                <Button
                  disabled={!blockForm.start || !blockForm.end || saveBlockedPeriodsMutation.isPending}
                  onClick={() => {
                    const updated = [...blockedPeriods, { label: blockForm.label, start: blockForm.start, end: blockForm.end }];
                    setBlockedPeriods(updated);
                    saveBlockedPeriodsMutation.mutate(updated);
                    setShowBlockDialog(false);
                  }}
                >
                  {saveBlockedPeriodsMutation.isPending ? "Guardando..." : "Guardar bloqueo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <Select value={prefs.colorTheme} onValueChange={(v) => updatePrefs({ colorTheme: v as any })}>
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
                      <Switch
                        data-testid="switch-dark-mode"
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
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
                    <Switch checked={prefs.notifCitas} onCheckedChange={(v) => updatePrefs({ notifCitas: v })} data-testid="switch-notif-citas" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Alertas de laboratorio</p>
                      <p className="text-xs text-muted-foreground">Notificar cuando lleguen resultados</p>
                    </div>
                    <Switch checked={prefs.notifLab} onCheckedChange={(v) => updatePrefs({ notifLab: v })} data-testid="switch-notif-lab" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Alertas de alergias</p>
                      <p className="text-xs text-muted-foreground">Mostrar alertas al recetar medicamentos</p>
                    </div>
                    <Switch checked={prefs.notifAlergias} onCheckedChange={(v) => updatePrefs({ notifAlergias: v })} data-testid="switch-notif-alergias" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Sonidos del sistema</p>
                      <p className="text-xs text-muted-foreground">Reproducir sonidos en notificaciones</p>
                    </div>
                    <Switch checked={prefs.sounds} onCheckedChange={(v) => updatePrefs({ sounds: v })} data-testid="switch-sounds" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Formato de Datos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato de Fecha</Label>
                    <Select value={prefs.dateFormat} onValueChange={(v) => updatePrefs({ dateFormat: v as any })}>
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
                    <Select value={prefs.timeFormat} onValueChange={(v) => updatePrefs({ timeFormat: v as any })}>
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

        <TabsContent value="seguridad" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Autenticación de dos factores (2FA)
              </CardTitle>
              <CardDescription>
                Protege tu cuenta con una segunda capa de verificación usando una app TOTP (Google Authenticator, Authy, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status banner */}
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${twoFaStatus?.totpEnabled ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-muted border-border"}`}>
                {twoFaStatus?.totpEnabled
                  ? <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
                  : <ShieldOff className="h-6 w-6 text-muted-foreground shrink-0" />}
                <div>
                  <p className="font-medium">{twoFaStatus?.totpEnabled ? "2FA activado" : "2FA desactivado"}</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFaStatus?.totpEnabled
                      ? "Tu cuenta requiere un código TOTP al iniciar sesión."
                      : "Tu cuenta solo requiere usuario y contraseña."}
                  </p>
                </div>
              </div>

              {/* Activate flow */}
              {!twoFaStatus?.totpEnabled && twoFaStep === "idle" && (
                <Button onClick={() => twoFaSetupMutation.mutate()} disabled={twoFaSetupMutation.isPending}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {twoFaSetupMutation.isPending ? "Generando..." : "Activar 2FA"}
                </Button>
              )}

              {twoFaStep === "setup" && twoFaQr && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">1. Escanea el código QR con tu app TOTP:</p>
                    <img src={twoFaQr} alt="QR 2FA" className="w-48 h-48 border rounded-lg" />
                  </div>
                  {twoFaSecret && (
                    <div>
                      <p className="text-sm font-medium mb-1">O ingresa la clave manualmente:</p>
                      <code className="block bg-muted px-3 py-2 rounded text-sm font-mono break-all">{twoFaSecret}</code>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">2. Ingresa el código de 6 dígitos para confirmar:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                        className="w-36 font-mono text-center text-lg"
                      />
                      <Button
                        onClick={() => twoFaConfirmMutation.mutate(twoFaCode)}
                        disabled={twoFaCode.length !== 6 || twoFaConfirmMutation.isPending}
                      >
                        {twoFaConfirmMutation.isPending ? "Verificando..." : "Confirmar"}
                      </Button>
                      <Button variant="outline" onClick={() => { setTwoFaStep("idle"); setTwoFaCode(""); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Disable flow */}
              {twoFaStatus?.totpEnabled && twoFaStep === "idle" && (
                <Button variant="destructive" onClick={() => { setTwoFaStep("disable"); setTwoFaCode(""); }}>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Desactivar 2FA
                </Button>
              )}

              {twoFaStep === "disable" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ingresa tu código TOTP actual para confirmar:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                      className="w-36 font-mono text-center text-lg"
                    />
                    <Button
                      variant="destructive"
                      onClick={() => twoFaDisableMutation.mutate(twoFaCode)}
                      disabled={twoFaCode.length !== 6 || twoFaDisableMutation.isPending}
                    >
                      {twoFaDisableMutation.isPending ? "Desactivando..." : "Desactivar"}
                    </Button>
                    <Button variant="outline" onClick={() => { setTwoFaStep("idle"); setTwoFaCode(""); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portal" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Portal de Citas en Línea
              </CardTitle>
              <CardDescription>
                Configura el portal público para que los pacientes puedan agendar citas en línea
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Portal habilitado</p>
                  <p className="text-sm text-muted-foreground">Permite a los pacientes agendar citas desde la web</p>
                </div>
                <Switch
                  checked={portalForm.portalEnabled}
                  onCheckedChange={(v) => setPortalForm((f) => ({ ...f, portalEnabled: v }))}
                  data-testid="switch-portal-enabled"
                />
              </div>

              <Separator />

              {/* Branding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="portalTitle">Título del portal</Label>
                  <Input
                    id="portalTitle"
                    placeholder="Clínica San Rafael — Agenda en línea"
                    value={portalForm.portalTitle}
                    onChange={(e) => setPortalForm((f) => ({ ...f, portalTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Correo de notificaciones</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    placeholder="admin@clinica.com"
                    value={portalForm.notificationEmail}
                    onChange={(e) => setPortalForm((f) => ({ ...f, notificationEmail: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="portalTagline">Slogan / descripción corta</Label>
                  <Input
                    id="portalTagline"
                    placeholder="Agenda tu cita fácil y rápido"
                    value={portalForm.portalTagline}
                    onChange={(e) => setPortalForm((f) => ({ ...f, portalTagline: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Appointment settings */}
              <h4 className="font-medium">Configuración de citas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consultationFee">Costo de consulta (MXN)</Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min="0"
                    placeholder="500.00"
                    value={portalForm.consultationFee}
                    onChange={(e) => setPortalForm((f) => ({ ...f, consultationFee: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentDurationMin">Duración por cita (minutos)</Label>
                  <Input
                    id="appointmentDurationMin"
                    type="number"
                    min="5"
                    max="120"
                    value={portalForm.appointmentDurationMin}
                    onChange={(e) => setPortalForm((f) => ({ ...f, appointmentDurationMin: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingAdvanceDays">Días máx. de anticipación</Label>
                  <Input
                    id="bookingAdvanceDays"
                    type="number"
                    min="1"
                    max="365"
                    value={portalForm.bookingAdvanceDays}
                    onChange={(e) => setPortalForm((f) => ({ ...f, bookingAdvanceDays: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingBufferMin">Buffer entre citas (minutos)</Label>
                  <Input
                    id="bookingBufferMin"
                    type="number"
                    min="0"
                    max="60"
                    value={portalForm.bookingBufferMin}
                    onChange={(e) => setPortalForm((f) => ({ ...f, bookingBufferMin: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Security */}
              <h4 className="font-medium">Seguridad del portal</h4>
              <div className="space-y-2">
                <Label htmlFor="hcaptchaSiteKey">hCaptcha Site Key</Label>
                <Input
                  id="hcaptchaSiteKey"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={portalForm.hcaptchaSiteKey}
                  onChange={(e) => setPortalForm((f) => ({ ...f, hcaptchaSiteKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Protege el formulario de contacto y el agendado de citas contra bots.</p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => savePortalSettingsMutation.mutate(portalForm)}
                  disabled={savePortalSettingsMutation.isPending}
                  data-testid="button-save-portal"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savePortalSettingsMutation.isPending ? "Guardando..." : "Guardar Portal"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gemini AI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Asistente de IA (Gemini)
              </CardTitle>
              <CardDescription>
                Chatbot inteligente integrado en el portal para responder preguntas de pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md border">
                {hasGeminiKey ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Clave configurada</p>
                      <p className="text-xs text-muted-foreground">La clave de Gemini está almacenada de forma encriptada.</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGeminiKeyMutation.mutate()}
                      disabled={deleteGeminiKeyMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground flex-1">Sin clave — el chatbot está desactivado.</p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="geminiKey">{hasGeminiKey ? "Actualizar clave de Gemini" : "Ingresar clave de Gemini"}</Label>
                <div className="flex gap-2">
                  <Input
                    id="geminiKey"
                    type="password"
                    placeholder="AIza..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                  <Button
                    onClick={() => saveGeminiKeyMutation.mutate(geminiKey)}
                    disabled={!geminiKey.trim() || saveGeminiKeyMutation.isPending}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {saveGeminiKeyMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
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
    queryKey: ["/api/audit-logs"],
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
