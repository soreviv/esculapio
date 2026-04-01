import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Menu, X, Phone } from "lucide-react";
import { useState } from "react";
import { usePortalSlug, portalFetch } from "./usePortalApi";
import PortalChatWidget from "./PortalChatWidget";
import type { PortalSettings } from "@shared/schema";
import logo64w from "@/assets/portal/logo-64w.webp";

// Public portal info: portalSettings minus sensitive keys, plus chatEnabled boolean
export type PortalPublicInfo = Omit<PortalSettings, "geminiApiKeyEncrypted" | "hcaptchaSecretKey"> & {
  chatEnabled: boolean;
};

export function usePortalInfo() {
  const slug = usePortalSlug();
  return useQuery<PortalPublicInfo>({
    queryKey: ["portal-info", slug],
    queryFn: () => portalFetch<PortalPublicInfo>(slug, "/portal-info"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const slug = usePortalSlug();
  const { data: info } = usePortalInfo();
  const [mobileOpen, setMobileOpen] = useState(false);

  const clinicName = info?.portalTitle ?? info?.nombreEstablecimiento ?? "Consultorio";

  const navLinks = [
    { href: `/p/${slug}`, label: "Inicio" },
    { href: `/p/${slug}/servicios`, label: "Servicios" },
    { href: `/p/${slug}/cita`, label: "Agendar Cita" },
    { href: `/p/${slug}/contacto`, label: "Contacto" },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/p/${slug}`} className="flex items-center gap-2">
            {info?.logoUrl ? (
              <img src={info.logoUrl} alt={clinicName} className="h-10 w-auto object-contain" />
            ) : (
              <img src={logo64w} alt={clinicName} className="h-10 w-auto object-contain" />
            )}
            <span className="font-bold text-primary text-lg hidden sm:block">{clinicName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 hover:text-primary font-medium transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-primary py-2 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-3">{clinicName}</h3>
              {info?.portalTagline && (
                <p className="text-slate-400 text-sm">{info.portalTagline}</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Contacto</h4>
              <div className="space-y-2 text-sm text-slate-400">
                {info?.telefono && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${info.telefono}`} className="hover:text-white transition-colors">
                      {info.telefono}
                    </a>
                  </p>
                )}
                {info?.domicilio && (
                  <p>{info.domicilio}{info.ciudad ? `, ${info.ciudad}` : ""}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href={`/p/${slug}/privacidad`} className="block text-slate-400 hover:text-white transition-colors">
                  Aviso de Privacidad
                </Link>
                <Link href={`/p/${slug}/terminos`} className="block text-slate-400 hover:text-white transition-colors">
                  Términos de Servicio
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Chat widget — only if chatbot is configured */}
      {info?.chatEnabled && (
        <PortalChatWidget slug={slug} clinicName={clinicName} />
      )}
    </div>
  );
}
