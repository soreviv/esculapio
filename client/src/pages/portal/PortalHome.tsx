import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { usePortalSlug } from "./usePortalApi";
import { usePortalInfo } from "./PortalLayout";
import { portalServices } from "./portalServicesData";
import PortalLayout from "./PortalLayout";
import hero640w from "@/assets/portal/hero-640w.webp";
import hero1024w from "@/assets/portal/hero-1024w.webp";
import doctor448w from "@/assets/portal/doctor-profile-448w.webp";
import doctor896w from "@/assets/portal/doctor-profile-896w.webp";

export default function PortalHome() {
  const slug = usePortalSlug();
  const { data: info } = usePortalInfo();
  const prefersReducedMotion = useReducedMotion();

  const clinicName = info?.portalTitle ?? info?.nombreEstablecimiento ?? "Consultorio";

  return (
    <PortalLayout>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative bg-slate-50 py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
                className="max-w-2xl"
              >
                <span className="inline-block py-1 px-3 rounded-full bg-secondary/20 text-primary font-bold text-sm mb-6 border border-secondary/20">
                  Dr. Alejandro Viveros Dominguez
                </span>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 leading-tight mb-6">
                  Cuidando tus Sentidos, <br />
                  <span className="text-primary">Mejorando tu Vida</span>
                </h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Especialista en Otorrinolaringología dedicado a proporcionar diagnósticos precisos y
                  tratamientos efectivos para problemas de oído, nariz y garganta.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={`/p/${slug}/cita`}>
                    <Button size="lg" className="text-lg px-8 h-14 bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl transition-all">
                      Agendar Cita
                    </Button>
                  </Link>
                  <Link href={`/p/${slug}/servicios`}>
                    <Button variant="outline" size="lg" className="text-lg px-8 h-14 bg-white border-primary/20 text-primary hover:bg-primary/5">
                      Ver Servicios
                    </Button>
                  </Link>
                </div>
                <div className="mt-12 flex items-center gap-8 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-secondary h-5 w-5" />
                    <span>Tecnología Avanzada</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.2 }}
                className="relative lg:h-[600px] hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2rem] transform rotate-3 scale-95 z-0" />
                <img
                  src={hero1024w}
                  srcSet={`${hero640w} 640w, ${hero1024w} 1024w`}
                  sizes="(min-width: 1024px) 50vw, 0px"
                  alt="Consultorio Médico"
                  width={1024}
                  height={1024}
                  className="relative z-10 w-full h-full object-cover rounded-[2rem] shadow-2xl"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                />
                <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-xl shadow-xl z-20 max-w-xs animate-in slide-in-from-bottom-4 duration-1000 border-l-4 border-secondary">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-secondary/20 p-2 rounded-full">
                      <Star className="h-6 w-6 text-secondary fill-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Excelencia Médica</p>
                      <p className="text-xs text-slate-500">Más de 10 años de experiencia</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Doctor Intro */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="relative order-2 md:order-1">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl opacity-50" />
                <img
                  src={doctor896w}
                  srcSet={`${doctor448w} 448w, ${doctor896w} 896w`}
                  sizes="(min-width: 768px) 448px, 100vw"
                  alt="Dr. Alejandro Viveros"
                  width={448}
                  height={672}
                  className="relative rounded-2xl shadow-lg w-full max-w-md mx-auto object-cover border-8 border-white"
                  loading="lazy"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-display font-bold mb-6 text-primary">Conoce al Dr. Viveros</h2>
                <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                  El Dr. Alejandro Viveros Domínguez es Médico Cirujano egresado de la Facultad Mexicana de Medicina
                  de la Universidad La Salle, con especialidad en Otorrinolaringología y Cirugía de Cabeza y Cuello
                  por la UNAM, formado en el Centro Médico Nacional La Raza. Su enfoque se centra en brindar una
                  atención humana, ética y de alta calidad.
                </p>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Comprometido con la actualización constante, utiliza las técnicas más modernas y menos invasivas
                  para asegurar la rápida recuperación de sus pacientes.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Médico Cirujano — Universidad La Salle (Ced. Prof. 6277305)
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Especialidad en ORL y CCC — UNAM / Centro Médico Nacional La Raza (Ced. Esp. 10148701)
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Miembro de la Sociedad Mexicana de Otorrinolaringología y Cirugía de Cabeza y Cuello
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Médico adscrito al IMSS desde 2016
                  </li>
                </ul>
                <p className="text-sm text-slate-500">
                  Verifica las cédulas en el{" "}
                  <a
                    href="https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary transition-colors"
                  >
                    Registro Nacional de Profesionistas (SEP)
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Preview */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-display font-bold mb-4 text-primary">Nuestros Servicios</h2>
              <p className="text-slate-600">
                Ofrecemos una amplia gama de servicios especializados para el cuidado integral de tu salud.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {portalServices.slice(0, 3).map((service) => (
                <div key={service.id} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-100 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800">{service.title}</h3>
                  <p className="text-slate-600 mb-6">{service.description}</p>
                  <Link href={`/p/${slug}/servicios`} className="text-accent font-medium hover:underline inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Leer más <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href={`/p/${slug}/servicios`}>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Ver todos los servicios
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17 0h6v17h17v6H23v17h-6V23H0v-6h17z' fill='%23fff' fill-opacity='.4'/%3E%3C/svg%3E\")" }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">¿Listo para mejorar tu salud?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Agenda tu cita hoy mismo. Contamos con horarios flexibles y atención de urgencias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/p/${slug}/cita`}>
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-accent hover:bg-accent/90 text-white border-0">
                  Agendar Cita Ahora
                </Button>
              </Link>
              <Link href={`/p/${slug}/contacto`}>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent border-white text-white hover:bg-white/10 hover:text-white">
                  Contáctanos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PortalLayout>
  );
}
