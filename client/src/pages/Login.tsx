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
import { useToast } from "@/hooks/use-toast";
import { Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
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
      setLocation("/");
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
      setLocation("/");
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

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Sistema conforme a NOM-024-SSA3-2012</p>
            <p>Protección de datos según LFPDPPP</p>
          </div>
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
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Sistema conforme a NOM-024-SSA3-2012</p>
          <p>Protección de datos según LFPDPPP</p>
        </div>
      </div>
    </div>
  );
}
