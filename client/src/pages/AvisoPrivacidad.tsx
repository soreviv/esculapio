import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, UserCheck, Lock, AlertCircle, Phone } from "lucide-react";

export default function AvisoPrivacidad() {
  const currentDate = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-aviso-title">
          Aviso de Privacidad
        </h1>
        <p className="text-sm text-muted-foreground">
          Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Última actualización: {currentDate}
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Identidad del Responsable
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                <strong>MediRecord</strong> (en adelante "el Responsable") con domicilio en [Dirección del establecimiento], 
                es el responsable del tratamiento de sus datos personales.
              </p>
              <p>
                El presente Aviso de Privacidad tiene como objetivo informarle sobre el tratamiento que se le dará 
                a sus datos personales cuando los mismos son recabados, utilizados, almacenados y/o transferidos 
                por el Responsable, lo cual se hace de su conocimiento en cumplimiento a lo dispuesto en la 
                Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Datos Personales Recabados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>Para las finalidades señaladas en el presente aviso de privacidad, se recabarán los siguientes datos personales:</p>
              
              <div className="space-y-2">
                <p><strong>Datos de identificación:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Nombre completo</li>
                  <li>CURP</li>
                  <li>Fecha de nacimiento</li>
                  <li>Sexo</li>
                  <li>Domicilio</li>
                  <li>Teléfono y correo electrónico</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p><strong>Datos sensibles de salud:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Historial clínico</li>
                  <li>Estado de salud presente y pasado</li>
                  <li>Diagnósticos médicos</li>
                  <li>Tratamientos y medicamentos</li>
                  <li>Resultados de estudios de laboratorio</li>
                  <li>Signos vitales</li>
                  <li>Alergias</li>
                  <li>Grupo sanguíneo</li>
                  <li>Información genética</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Finalidades del Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p><strong>Finalidades primarias (necesarias para la prestación del servicio):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Creación y gestión del expediente clínico electrónico</li>
                <li>Prestación de servicios médicos y de salud</li>
                <li>Diagnóstico, tratamiento y seguimiento médico</li>
                <li>Expedición de recetas médicas</li>
                <li>Agendamiento y gestión de citas</li>
                <li>Comunicación con el paciente sobre su atención médica</li>
                <li>Cumplimiento de obligaciones derivadas de la relación médico-paciente</li>
                <li>Cumplimiento de la NOM-024-SSA3-2012 y normatividad aplicable</li>
              </ul>

              <p className="mt-4"><strong>Finalidades secundarias (no necesarias pero útiles):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Envío de recordatorios de citas</li>
                <li>Comunicaciones informativas sobre servicios de salud</li>
                <li>Estadísticas y reportes epidemiológicos (datos anonimizados)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Medidas de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                El Responsable ha implementado y mantiene las medidas de seguridad administrativas, técnicas y físicas 
                que permiten proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, 
                acceso o tratamiento no autorizado.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cifrado de datos en tránsito mediante protocolo HTTPS</li>
                <li>Control de acceso basado en roles</li>
                <li>Registro de auditoría de accesos y modificaciones</li>
                <li>Firma electrónica de notas médicas</li>
                <li>Respaldos automáticos de información</li>
                <li>Capacitación del personal en protección de datos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Derechos ARCO
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y 
                las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección 
                de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); 
                que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo 
                utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines 
                específicos (Oposición). Estos derechos se conocen como derechos ARCO.
              </p>
              <p>
                Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva 
                a través del correo electrónico: [correo@establecimiento.com] o directamente en nuestras instalaciones.
              </p>
              <p>
                Su solicitud deberá contener:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Nombre completo y domicilio</li>
                <li>Documentos que acrediten su identidad o representación legal</li>
                <li>Descripción clara y precisa de los datos personales</li>
                <li>Cualquier otro elemento que facilite la localización de los datos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                Si usted tiene alguna duda sobre el presente aviso de privacidad, puede dirigirla a:
              </p>
              <div className="bg-muted p-4 rounded-md">
                <p><strong>Oficial de Protección de Datos Personales</strong></p>
                <p>Correo: privacidad@medirecord.com</p>
                <p>Teléfono: [Número de teléfono]</p>
                <p>Domicilio: [Dirección completa]</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                El Responsable se reserva el derecho de efectuar en cualquier momento modificaciones o actualizaciones 
                al presente aviso de privacidad, para la atención de novedades legislativas o jurisprudenciales, 
                políticas internas, nuevos requerimientos para la prestación u ofrecimiento de nuestros servicios 
                y prácticas del mercado. Estas modificaciones estarán disponibles al público a través de nuestra 
                página web y/o en nuestras instalaciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
