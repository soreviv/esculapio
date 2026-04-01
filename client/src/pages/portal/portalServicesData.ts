export interface PortalService {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const portalServices: PortalService[] = [
  {
    id: "1",
    title: "Consulta de Otorrinolaringología",
    description: "Diagnóstico y tratamiento de enfermedades de oído, nariz y garganta.",
    icon: "Stethoscope",
  },
  {
    id: "2",
    title: "Vacunas",
    description: "Aplicación de vacunas preventivas para proteger la salud de toda la familia.",
    icon: "Syringe",
  },
  {
    id: "3",
    title: "Cirugía Endoscópica",
    description: "Procedimientos mínimamente invasivos para sinusitis y pólipos.",
    icon: "Activity",
  },
  {
    id: "4",
    title: "Rinoplastia Funcional",
    description: "Corrección estética y funcional de la nariz.",
    icon: "Sparkles",
  },
  {
    id: "5",
    title: "Laringoscopia",
    description: "Examen visual de la laringe y cuerdas vocales.",
    icon: "Mic",
  },
  {
    id: "6",
    title: "Urgencias ORL",
    description: "Atención inmediata a cuerpos extraños, sangrados y dolor agudo.",
    icon: "Ambulance",
  },
];
