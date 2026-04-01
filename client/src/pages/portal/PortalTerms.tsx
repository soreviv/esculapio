import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { usePortalSlug } from "./usePortalApi";
import PortalLayout from "./PortalLayout";

export default function PortalTerms() {
  const slug = usePortalSlug();

  return (
    <PortalLayout>
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Link href={`/p/${slug}`}>
              <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Volver al inicio
              </Button>
            </Link>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">Términos de Servicio</h1>

            <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
              <p className="text-lg">
                Al utilizar este portal de agendamiento de citas, usted acepta los siguientes términos y condiciones.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Uso del Portal</h3>
              <p>
                Este portal está diseñado exclusivamente para facilitar el agendamiento de citas con el consultorio
                del Dr. Alejandro Viveros Domínguez. El uso del portal implica la aceptación de estos términos.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Agendamiento de Citas</h3>
              <p>
                Las citas agendadas a través de este portal son solicitudes y quedan sujetas a confirmación por parte
                del consultorio. El paciente recibirá un correo de confirmación con los detalles de la cita.
              </p>
              <p>
                Para cancelar o modificar una cita, utilice los enlaces proporcionados en el correo de confirmación
                con al menos 24 horas de anticipación.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Información Personal</h3>
              <p>
                Los datos personales proporcionados durante el agendamiento son tratados conforme a nuestro{" "}
                <Link href={`/p/${slug}/privacidad`} className="text-primary hover:underline">
                  Aviso de Privacidad
                </Link>
                .
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Responsabilidades</h3>
              <p>
                El portal de agendamiento es una herramienta de comunicación y no sustituye la consulta médica
                presencial. En caso de emergencia, acuda al servicio de urgencias más cercano o llame al 911.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Modificaciones</h3>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán
                publicados en este portal.
              </p>

              <p className="mt-8 text-sm text-slate-500 border-t pt-4">
                Última actualización: 11 de Diciembre de 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
