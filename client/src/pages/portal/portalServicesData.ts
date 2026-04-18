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
    description:
      "Evaluación especializada de padecimientos del oído, nariz y garganta. Incluye interrogatorio clínico, exploración física con videoendoscopio y orientación sobre el diagnóstico y plan de tratamiento.",
    icon: "Stethoscope",
  },
  {
    id: "2",
    title: "Vacunas",
    description:
      "Aplicación de vacunas preventivas para toda la familia conforme al esquema nacional de vacunación SSA y recomendaciones CDC. Consulta nuestra guía interactiva para conocer las vacunas indicadas según tu edad y condición de salud.",
    icon: "Syringe",
  },
  {
    id: "3",
    title: "Cirugía Endoscópica",
    description:
      "Procedimientos mínimamente invasivos para el tratamiento de sinusitis crónica, pólipos nasales y desviación de tabique. Técnica endoscópica que permite una recuperación más rápida y menor riesgo de complicaciones.",
    icon: "Activity",
  },
  {
    id: "4",
    title: "Rinoplastia Funcional",
    description:
      "Corrección quirúrgica de alteraciones estructurales de la nariz que afectan la respiración, combinada con mejora estética cuando es necesaria. Se realiza bajo anestesia general con resultados definitivos.",
    icon: "Sparkles",
  },
  {
    id: "5",
    title: "Laringoscopia",
    description:
      "Exploración directa de la laringe y cuerdas vocales mediante un laringoscopio de fibra óptica flexible. Permite diagnosticar nódulos, pólipos, parálisis y lesiones precancerosas en el consultorio, sin necesidad de hospitalización.",
    icon: "Mic",
  },
  {
    id: "6",
    title: "Urgencias ORL",
    description:
      "Atención inmediata a urgencias otorrinolaringológicas: cuerpos extraños en oído, nariz y garganta; epistaxis (sangrados nasales); dolor ótico agudo y abscesos. Se brinda atención preferente para reducir el tiempo de espera.",
    icon: "Ambulance",
  },
];
