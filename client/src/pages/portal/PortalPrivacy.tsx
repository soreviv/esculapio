import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { usePortalSlug } from "./usePortalApi";
import PortalLayout from "./PortalLayout";

export default function PortalPrivacy() {
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
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">Aviso de Privacidad</h1>

            <div className="prose prose-slate max-w-none text-slate-600">
              <p className="lead text-lg mb-6">
                Alejandro Viveros Domínguez con domicilio en Chosica 730, Colonia Lindavista, C.P. 07300,
                Alcaldía Gustavo A. Madero en la Ciudad de México y portal de internet www.otorrinonet.com, es el
                responsable del uso y protección de sus datos personales conforme a este aviso de privacidad.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">
                ¿Para qué fines utilizaremos sus datos personales?
              </h3>
              <p>
                Los datos personales que recabamos de usted los utilizaremos para las siguientes finalidades que son
                necesarias para el servicio que solicita:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 mb-6">
                <li>La creación, estudio, análisis, actualización y conservación del expediente clínico.</li>
                <li>La facturación y cobranza por la prestación de los servicios.</li>
              </ul>

              <p>
                De manera adicional, utilizaremos su información personal para las siguientes finalidades secundarias
                que no son necesarias para el servicio solicitado, pero que nos permiten y facilitan brindarle una
                mejor atención:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 mb-6">
                <li>Para la investigación y estadísticas relacionadas con la salud.</li>
                <li>Mercadotecnia o publicitaria.</li>
              </ul>

              <p className="mb-4">
                En caso de que no desee que sus datos personales se utilicen para estos fines secundarios, puede
                indicarlo comunicándose con nosotros.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">
                ¿Qué datos personales utilizaremos para estos fines?
              </h3>
              <ul className="list-disc pl-6 space-y-2 mt-4 mb-6">
                <li>Datos de identificación</li>
                <li>Datos de contacto</li>
                <li>Datos sobre características físicas</li>
                <li>Datos laborales</li>
                <li>Datos académicos</li>
                <li>Datos de salud (sensibles)</li>
              </ul>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">
                ¿Con quién compartimos su información personal y para qué fines?
              </h3>
              <div className="overflow-x-auto my-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="py-2 font-bold text-slate-900">Destinatario</th>
                      <th scope="col" className="py-2 font-bold text-slate-900">Finalidad</th>
                      <th scope="col" className="py-2 font-bold text-slate-900">Requiere consentimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Secretaría de Salud local</td>
                      <td className="py-2">Para el cumplimiento de las obligaciones sanitarias que impone la ley.</td>
                      <td className="py-2">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Su aseguradora</td>
                      <td className="py-2">Para realizar los trámites correspondientes para la intervención del seguro.</td>
                      <td className="py-2">Sí</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Servicio de Administración Tributaria</td>
                      <td className="py-2">Para la facturación en cumplimiento de las disposiciones fiscales.</td>
                      <td className="py-2">No</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">
                ¿Cómo puede acceder, rectificar o cancelar sus datos personales?
              </h3>
              <p>
                Usted tiene derecho a conocer qué datos personales tenemos, para qué los utilizamos y las condiciones
                del uso que les damos (Derechos ARCO). Para ejercerlos, envíe solicitud escrita con copia de
                identificación oficial al correo:{" "}
                <a
                  href="mailto:contacto@otorrinonet.com?subject=Solicitud%20ARCO"
                  className="text-primary hover:underline"
                >
                  contacto@otorrinonet.com
                </a>
                .
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">
                El uso de tecnologías de rastreo en nuestro portal de internet
              </h3>
              <p>
                Le informamos que en nuestra página de internet utilizamos cookies y tecnologías similares para
                monitorear el comportamiento como usuario de internet y brindarle un mejor servicio.
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
