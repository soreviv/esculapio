import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  FlaskConical,
  Pill,
  Settings,
  HelpCircle,
  Activity,
  Building2,
  Shield,
  Inbox,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
  },
  {
    title: "Expedientes",
    url: "/expedientes",
    icon: FileText,
  },
  {
    title: "Citas",
    url: "/citas",
    icon: Calendar,
  },
];

const clinicalItems = [
  {
    title: "Laboratorio",
    url: "/laboratorio",
    icon: FlaskConical,
  },
  {
    title: "Recetas",
    url: "/recetas",
    icon: Pill,
  },
  {
    title: "Signos Vitales",
    url: "/signos-vitales",
    icon: Activity,
  },
];

const systemItems = [
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
  {
    title: "Mensajes del Portal",
    url: "/mensajes-contacto",
    icon: Inbox,
    adminOnly: true,
  },
  {
    title: "Aviso de Privacidad",
    url: "/aviso-privacidad",
    icon: Shield,
  },
  {
    title: "Ayuda",
    url: "/ayuda",
    icon: HelpCircle,
  },
];

interface AppSidebarProps {
  user: { nombre: string; especialidad?: string; role: string };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">MediRecord</h2>
            <p className="text-xs text-muted-foreground">NOM-024 Compliant</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Clínico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clinicalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems
                .filter((item) => !("adminOnly" in item && item.adminOnly) || user.role === "admin")
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user.nombre.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.especialidad ?? (user.role === "medico" ? "Médico" : user.role === "enfermeria" ? "Enfermería" : user.role === "admin" ? "Administrador" : user.role)}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
