import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Ear, Activity, Sparkles, Mic, Ambulance, Syringe } from "lucide-react";
import { usePortalSlug } from "./usePortalApi";
import { portalServices } from "./portalServicesData";
import PortalLayout from "./PortalLayout";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Ear,
  Activity,
  Sparkles,
  Mic,
  Ambulance,
  Syringe,
};

export default function PortalServices() {
  const slug = usePortalSlug();

  return (
    <PortalLayout>
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Servicios Especializados</h1>
            <p className="text-lg text-slate-600">
              Diagnóstico, tratamiento y cirugía de padecimientos de oído, nariz y garganta con tecnología de
              vanguardia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portalServices.map((service) => {
              const Icon = iconMap[service.icon] || Stethoscope;
              return (
                <Card key={service.id} className="hover:shadow-lg transition-all duration-300 border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-6">{service.description}</CardDescription>
                    <Link href={`/p/${slug}/cita`}>
                      <Button variant="outline" className="w-full">
                        Agendar Cita
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-20 bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-2">¿No encuentras lo que buscas?</h3>
              <p className="text-slate-600">
                Contáctanos para recibir información personalizada sobre tu padecimiento.
              </p>
            </div>
            <Link href={`/p/${slug}/contacto`}>
              <Button size="lg">Contactar al Consultorio</Button>
            </Link>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
