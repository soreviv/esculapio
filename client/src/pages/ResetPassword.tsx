import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const resetSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = new URLSearchParams(searchString).get("token") ?? "";

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`/api/password-reset-validate/${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTokenValid(data.valid === true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const confirmMutation = useMutation({
    mutationFn: async (data: ResetFormData) => {
      const response = await apiRequest("POST", "/api/password-reset-confirm", {
        token,
        password: data.password,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Error al restablecer la contraseña");
      }
      return response.json();
    },
    onSuccess: () => setResetSuccess(true),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle>Enlace inválido</CardTitle>
            <CardDescription>
              Este enlace de restablecimiento es inválido, ya fue utilizado o ha expirado.
              Los enlaces son válidos por 1 hora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/")}>
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle>Contraseña restablecida</CardTitle>
            <CardDescription>
              Su contraseña ha sido actualizada exitosamente. Ya puede iniciar sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/")}>
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>
            Ingrese su nueva contraseña. Debe tener al menos 8 caracteres y buena seguridad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => confirmMutation.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10" {...field} />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showConfirm ? "text" : "password"} className="pl-10 pr-10" {...field} />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowConfirm((v) => !v)}
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? "Guardando..." : "Establecer nueva contraseña"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
