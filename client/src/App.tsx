import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Pacientes from "@/pages/Pacientes";
import PatientDetail from "@/pages/PatientDetail";
import Citas from "@/pages/Citas";
import Expedientes from "@/pages/Expedientes";
import Laboratorio from "@/pages/Laboratorio";
import Recetas from "@/pages/Recetas";
import SignosVitales from "@/pages/SignosVitales";
import AvisoPrivacidad from "@/pages/AvisoPrivacidad";
import Ayuda from "@/pages/Ayuda";
import Configuracion from "@/pages/Configuracion";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  username?: string;
  role: string;
  nombre: string;
  especialidad?: string;
  cedula?: string;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/pacientes/:id" component={PatientDetail} />
      <Route path="/expedientes" component={Expedientes} />
      <Route path="/citas" component={Citas} />
      <Route path="/laboratorio" component={Laboratorio} />
      <Route path="/recetas" component={Recetas} />
      <Route path="/signos-vitales" component={SignosVitales} />
      <Route path="/aviso-privacidad" component={AvisoPrivacidad} />
      <Route path="/ayuda" component={Ayuda} />
      <Route path="/configuracion" component={Configuracion} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      queryClient.clear();
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      onLogout();
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-2 border-b h-14 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span data-testid="text-user-name">{user.nombre}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Cerrar sesión"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (userData: AuthUser) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <AuthenticatedApp user={user} onLogout={handleLogout} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
