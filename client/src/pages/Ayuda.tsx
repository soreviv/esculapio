import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  BookOpen,
  FileQuestion,
  Scale,
  Phone,
  UserPlus,
  FileText,
  Activity,
  Calendar,
  Pill,
  FlaskConical,
  Shield,
  Mail,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function Ayuda() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Centro de Ayuda</h1>
          <p className="text-muted-foreground">Guías, preguntas frecuentes y recursos de soporte</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Guía de Uso del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="guide-register-patient">
                <UserPlus className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Registrar un nuevo paciente</p>
                  <p className="text-sm text-muted-foreground">
                    Ve a Pacientes y haz clic en "Nuevo Paciente". Completa los datos personales, 
                    CURP, información de contacto y acepta los consentimientos requeridos por la LFPDPPP.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="guide-create-note">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Crear una nota médica</p>
                  <p className="text-sm text-muted-foreground">
                    Abre el expediente del paciente y selecciona "Nueva Nota". Elige el tipo de nota 
                    (Historia Clínica, Evolución, Egreso o Interconsulta) y completa los campos SOAP.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="guide-record-vitals">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Registrar signos vitales</p>
                  <p className="text-sm text-muted-foreground">
                    En la pestaña "Signos Vitales" del expediente, haz clic en "Registrar Signos". 
                    Ingresa presión arterial, frecuencia cardíaca, temperatura, saturación y peso.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="guide-schedule-appointment">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Agendar una cita</p>
                  <p className="text-sm text-muted-foreground">
                    Ve a la sección Citas y selecciona "Nueva Cita". Elige el paciente, fecha, hora, 
                    tipo de consulta y el médico que atenderá.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="guide-create-prescription">
                <Pill className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Crear una receta</p>
                  <p className="text-sm text-muted-foreground">
                    Desde el expediente del paciente, ve a "Recetas" y haz clic en "Nueva Receta". 
                    Agrega medicamentos con dosis, vía de administración, frecuencia y duración.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="guide-order-lab">
                <FlaskConical className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Ordenar estudios de laboratorio</p>
                  <p className="text-sm text-muted-foreground">
                    En la pestaña "Laboratorio" del expediente, selecciona "Ordenar Estudio". 
                    Elige los estudios requeridos y agrega indicaciones especiales.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger data-testid="faq-curp">¿Por qué es obligatorio el CURP?</AccordionTrigger>
                <AccordionContent>
                  La NOM-024-SSA3-2012 establece que el expediente clínico electrónico debe contener 
                  identificadores únicos del paciente. El CURP (Clave Única de Registro de Población) 
                  es el identificador oficial en México y garantiza la unicidad del registro.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger data-testid="faq-consent">¿Por qué debo aceptar consentimientos al registrar pacientes?</AccordionTrigger>
                <AccordionContent>
                  La Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) 
                  requiere que los pacientes otorguen su consentimiento informado para el tratamiento de 
                  sus datos personales y datos sensibles de salud antes de crear su expediente electrónico.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger data-testid="faq-signature">¿Cómo funciona la firma electrónica de notas?</AccordionTrigger>
                <AccordionContent>
                  Las notas médicas pueden firmarse electrónicamente. El sistema genera un hash SHA-256 
                  del contenido de la nota junto con la fecha/hora y el identificador del médico. 
                  Una vez firmada, la nota no puede modificarse, garantizando su integridad.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger data-testid="faq-audit">¿Se registran todas las acciones en el sistema?</AccordionTrigger>
                <AccordionContent>
                  Sí, el sistema mantiene un registro de auditoría completo (trazabilidad) de todas las 
                  operaciones: creación y modificación de pacientes, notas médicas, signos vitales, 
                  recetas y citas. Esto cumple con los requisitos de la NOM-024-SSA3-2012.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger data-testid="faq-cie10">¿Qué es el catálogo CIE-10?</AccordionTrigger>
                <AccordionContent>
                  El CIE-10 (Clasificación Internacional de Enfermedades, 10ª revisión) es el estándar 
                  internacional para codificar diagnósticos médicos. El sistema incluye un catálogo 
                  de códigos CIE-10 para estandarizar los diagnósticos en las notas médicas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger data-testid="faq-data-security">¿Cómo se protegen los datos de los pacientes?</AccordionTrigger>
                <AccordionContent>
                  Los datos se almacenan en bases de datos seguras con encriptación. El acceso está 
                  restringido por roles (médico, enfermería, administrador). Todas las conexiones 
                  utilizan HTTPS y las contraseñas se almacenan con hash seguro.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Normativa Aplicable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-md border space-y-2" data-testid="norm-nom024">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">NOM-024-SSA3-2012</Badge>
              </div>
              <p className="text-sm font-medium">Expediente Clínico Electrónico</p>
              <p className="text-xs text-muted-foreground">
                Establece los objetivos funcionales y funcionalidades que deberán observar 
                los productos de Sistemas de Expediente Clínico Electrónico para garantizar 
                la interoperabilidad, procesamiento, interpretación, confidencialidad, seguridad 
                y uso de estándares de la información de los registros electrónicos en salud.
              </p>
              <a 
                href="https://www.dof.gob.mx/nota_detalle.php?codigo=5272787&fecha=30/11/2012" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                Ver documento oficial
              </a>
            </div>

            <div className="p-3 rounded-md border space-y-2" data-testid="norm-lfpdppp">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">LFPDPPP</Badge>
              </div>
              <p className="text-sm font-medium">Ley Federal de Protección de Datos Personales</p>
              <p className="text-xs text-muted-foreground">
                Tiene por objeto la protección de los datos personales en posesión de los 
                particulares, con la finalidad de regular su tratamiento legítimo, controlado 
                e informado, a efecto de garantizar la privacidad y el derecho a la 
                autodeterminación informativa de las personas.
              </p>
              <a 
                href="http://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                Ver documento oficial
              </a>
            </div>

            <div className="p-3 rounded-md border space-y-2" data-testid="norm-nom004">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">NOM-004-SSA3-2012</Badge>
              </div>
              <p className="text-sm font-medium">Del Expediente Clínico</p>
              <p className="text-xs text-muted-foreground">
                Establece los criterios científicos, éticos, tecnológicos y administrativos 
                obligatorios en la elaboración, integración, uso, manejo, archivo, conservación, 
                propiedad, titularidad y confidencialidad del expediente clínico.
              </p>
              <a 
                href="https://www.dof.gob.mx/nota_detalle.php?codigo=5272787&fecha=30/11/2012" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                Ver documento oficial
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Soporte Técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-3">Contacto de Soporte</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">+52 (55) 1234-5678</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Correo Electrónico</p>
                    <p className="text-sm text-muted-foreground">soporte@medirecord.mx</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Horario de Atención</p>
                    <p className="text-sm text-muted-foreground">Lunes a Viernes: 8:00 - 20:00</p>
                    <p className="text-sm text-muted-foreground">Sábados: 9:00 - 14:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-md border">
              <p className="text-sm font-medium mb-2">Soporte de Emergencia 24/7</p>
              <p className="text-xs text-muted-foreground mb-2">
                Para incidentes críticos que afecten la operación del sistema:
              </p>
              <p className="text-sm font-medium text-primary">+52 (55) 8765-4321</p>
            </div>

            <div className="p-3 rounded-md border">
              <p className="text-sm font-medium mb-2">Mesa de Ayuda en Línea</p>
              <p className="text-xs text-muted-foreground">
                Levanta tickets de soporte y da seguimiento a tus solicitudes a través 
                de nuestro portal de atención.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
