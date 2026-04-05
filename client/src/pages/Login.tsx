import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound, HelpCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  id: string;
  username: string;
  role: string;
  nombre: string;
  especialidad?: string;
  cedula?: string;
}

interface LoginProps {
  onLogin: (user: LoginResponse) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  const recoveryMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/password-reset-request", { username });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Error al procesar la solicitud");
      }
      return response.json();
    },
    onSuccess: () => {
      setRecoverySent(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setShowError(false);
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return;
      }
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.nombre}`,
      });
      onLogin(data as LoginResponse);
      setLocation("/dashboard");
    },
    onError: () => {
      setShowError(true);
    },
  });

  const totpMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/2fa/verify", { code });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Código incorrecto");
      }
      return response.json();
    },
    onSuccess: (data: LoginResponse) => {
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.nombre}`,
      });
      onLogin(data);
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Código incorrecto",
        description: error.message,
        variant: "destructive",
      });
      setTotpCode("");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setShowError(false);
    loginMutation.mutate(data);
  };

  const onTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length === 6) totpMutation.mutate(totpCode);
  };

  if (requiresTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <KeyRound className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Verificación 2FA</h1>
            <p className="text-muted-foreground">
              Ingrese el código de su aplicación autenticadora
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Autenticación de dos factores</CardTitle>
              <CardDescription>
                Abra Google Authenticator, Authy u otra app TOTP y copie el código de 6 dígitos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onTotpSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={totpCode}
                    onChange={setTotpCode}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={totpCode.length !== 6 || totpMutation.isPending}
                >
                  {totpMutation.isPending ? "Verificando..." : "Verificar código"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setTotpCode("");
                    form.reset();
                  }}
                >
                  Volver al inicio de sesión
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-login-title">
            MediRecord
          </h1>
          <p className="text-muted-foreground">
            Sistema de Expediente Clínico Electrónico
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {showError && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Usuario o contraseña incorrectos</span>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="Ingrese su usuario"
                            className="pl-10"
                            data-testid="input-username"
                            autoComplete="username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingrese su contraseña"
                            className="pl-10 pr-10"
                            data-testid="input-password"
                            autoComplete="current-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="!absolute right-2 top-1/2 transform -translate-y-1/2 h-9 w-9 text-muted-foreground hover:bg-transparent z-10"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                    onClick={() => {
                      setRecoveryUsername("");
                      setRecoverySent(false);
                      setShowRecovery(true);
                    }}
                  >
                    <HelpCircle className="h-3.5 w-3.5 mr-1" />
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRecovery} onOpenChange={(open) => { setShowRecovery(open); if (!open) setRecoverySent(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu nombre de usuario para solicitar el restablecimiento de contraseña.
            </DialogDescription>
          </DialogHeader>

          {recoverySent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">Correo enviado</p>
                <p className="text-sm text-muted-foreground">
                  Si la cuenta existe, recibirás un correo con un enlace para restablecer tu contraseña.
                  El enlace es válido por <strong>1 hora</strong>. Revisa tu carpeta de spam si no lo encuentras.
                </p>
              </div>
              <Button className="w-full" onClick={() => { setShowRecovery(false); setRecoverySent(false); }}>
                Entendido
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="recovery-username" className="text-sm font-medium">Usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recovery-username"
                    placeholder="Ingrese su usuario"
                    className="pl-10"
                    value={recoveryUsername}
                    onChange={(e) => setRecoveryUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && recoveryUsername.trim()) {
                        recoveryMutation.mutate(recoveryUsername.trim());
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRecovery(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  disabled={!recoveryUsername.trim() || recoveryMutation.isPending}
                  onClick={() => recoveryMutation.mutate(recoveryUsername.trim())}
                >
                  {recoveryMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
