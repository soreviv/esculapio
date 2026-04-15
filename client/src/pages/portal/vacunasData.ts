// Calendario de Vacunación — México (SSA 2024) + complemento CDC 2025
// Para poblaciones generales y con condiciones de riesgo

export type Sex      = "all" | "female" | "male";
export type Priority = "routine" | "recommended" | "shared-decision";
export type Source   = "SSA" | "CDC" | "SSA+CDC";

export type Condition =
  | "diabetes"
  | "renal"
  | "hepatica"
  | "cardiaca"
  | "pulmonar"
  | "vih"
  | "inmunosupresion"
  | "asplenia"
  | "trasplante"
  | "embarazo"
  | "institucionalizado"
  | "trabajador_salud"
  | "viajero";

export const CONDITION_LABELS: Record<Condition, string> = {
  diabetes:          "Diabetes mellitus",
  renal:             "Enfermedad renal crónica / diálisis",
  hepatica:          "Enfermedad hepática crónica (hepatitis C, cirrosis)",
  cardiaca:          "Enfermedad cardíaca crónica",
  pulmonar:          "Enfermedad pulmonar crónica (EPOC, asma moderada-grave)",
  vih:               "VIH / SIDA",
  inmunosupresion:   "Inmunosupresión (corticoides, quimioterapia, biológicos)",
  asplenia:          "Asplenia o disfunción esplénica (anemia falciforme)",
  trasplante:        "Trasplante de órgano sólido o médula ósea",
  embarazo:          "Embarazo",
  institucionalizado:"Adulto mayor institucionalizado (asilo, casa hogar)",
  trabajador_salud:  "Trabajador de salud",
  viajero:           "Viajero internacional",
};

export const CONDITION_GROUPS = [
  {
    label: "Enfermedades metabólicas y crónicas",
    conditions: ["diabetes", "renal", "hepatica", "cardiaca", "pulmonar"] as Condition[],
  },
  {
    label: "Condiciones inmunológicas",
    conditions: ["vih", "inmunosupresion", "asplenia", "trasplante"] as Condition[],
  },
  {
    label: "Situaciones especiales",
    conditions: ["embarazo", "institucionalizado", "trabajador_salud", "viajero"] as Condition[],
  },
];

export interface Vaccine {
  id: string;
  name: string;
  shortName: string;
  description: string;
  minAge: number;          // años (ej. 0.17 = 2 meses)
  maxAge: number;          // años (999 = sin límite)
  sex: Sex;
  priority: Priority;
  source: Source;
  annual?: boolean;
  note?: string;
  conditionTriggers?: Condition[];   // condiciones que activan la vacuna fuera del rango de edad
  conditionNote?: string;            // nota especial cuando es por condición
  contraindications?: Condition[];   // condiciones donde está contraindicada
  contraindicationNote?: string;
}

export interface VaccineResult extends Vaccine {
  triggeredByCondition: boolean;
}

// ─── Catálogo ──────────────────────────────────────────────────────────────────

export const vaccines: Vaccine[] = [

  // ── Nacimiento a 6 años (Cartilla Nacional SSA) ────────────────────────────

  {
    id: "bcg",
    name: "BCG (Tuberculosis)",
    shortName: "BCG",
    description: "Protege contra formas graves de tuberculosis, especialmente meningitis tuberculosa en niños.",
    minAge: 0,
    maxAge: 1 / 12,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "Dosis única al nacer. Disponible gratuitamente en centros de salud SSA.",
  },
  {
    id: "hepb",
    name: "Hepatitis B",
    shortName: "HepB",
    description: "Previene la infección crónica por hepatitis B y sus complicaciones: cirrosis y cáncer de hígado.",
    minAge: 0,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    note: "Primera dosis al nacer; serie completa incluida en la Pentavalente. Adultos no vacunados deben completar esquema.",
    conditionTriggers: ["renal", "hepatica", "diabetes", "vih", "trasplante", "trabajador_salud"],
    conditionNote: "Prioritaria por mayor riesgo de infección o complicaciones graves.",
  },
  {
    id: "pentavalente",
    name: "Pentavalente (DPT + HepB + Hib)",
    shortName: "Pentavalente",
    description: "Vacuna combinada que protege contra difteria, tétanos, tosferina, hepatitis B y Haemophilus influenzae tipo b.",
    minAge: 2 / 12,
    maxAge: 18 / 12,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "Serie de 3 dosis a los 2, 4 y 6 meses. Refuerzo a los 18 meses. Gratuita en centros de salud SSA.",
  },
  {
    id: "rotavirus",
    name: "Rotavirus",
    shortName: "RV",
    description: "Previene la gastroenteritis grave por rotavirus, principal causa de diarrea severa con deshidratación en bebés.",
    minAge: 2 / 12,
    maxAge: 8 / 12,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "Serie de 2 dosis a los 2 y 4 meses. No iniciar después de las 15 semanas. Gratuita en SSA.",
  },
  {
    id: "pcv-child",
    name: "Neumococo conjugada (niños)",
    shortName: "PCV13",
    description: "Protege contra neumonía, meningitis y bacteriemia neumocócica en menores.",
    minAge: 2 / 12,
    maxAge: 5,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "3 dosis: 2, 4 y 12 meses. Gratuita en centros de salud SSA.",
  },
  {
    id: "ipv",
    name: "Poliomielitis inactivada (IPV)",
    shortName: "IPV",
    description: "Previene la poliomielitis, enfermedad que puede causar parálisis permanente.",
    minAge: 2 / 12,
    maxAge: 6,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "Serie: 2, 4, 6 meses (IPV); refuerzo con OPV a los 18 meses y 4 años. Gratuita en SSA.",
  },
  {
    id: "influenza",
    name: "Influenza (Gripe)",
    shortName: "Flu",
    description: "Reduce el riesgo de gripe estacional y sus complicaciones como neumonía y hospitalización.",
    minAge: 6 / 12,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    annual: true,
    note: "Anual, preferentemente en otoño. Primera vez en menores de 9 años: 2 dosis con 4 semanas de diferencia. Gratuita para menores de 3 años, embarazadas y adultos 60+ en SSA.",
    conditionTriggers: ["diabetes", "renal", "hepatica", "cardiaca", "pulmonar", "vih", "inmunosupresion", "asplenia", "trasplante", "embarazo", "institucionalizado", "trabajador_salud"],
    conditionNote: "Prioritaria. El riesgo de complicaciones graves es significativamente mayor en tu condición.",
  },
  {
    id: "srp",
    name: "Sarampión, Rubéola y Parotiditis",
    shortName: "SRP / MMR",
    description: "Protege contra sarampión, rubéola y paperas y sus complicaciones graves.",
    minAge: 1,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "2 dosis: primera al año de edad, segunda al ingreso escolar (6 años). Adultos no vacunados deben recibirla.",
    contraindications: ["inmunosupresion", "vih", "trasplante"],
    contraindicationNote: "Vacuna de virus vivos: puede estar contraindicada en inmunocomprometidos graves. Consultar con médico antes de aplicar.",
  },
  {
    id: "varicela",
    name: "Varicela",
    shortName: "VAR",
    description: "Previene la varicela y reduce el riesgo de herpes zóster en etapas posteriores.",
    minAge: 1,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    note: "1 dosis al año en el esquema SSA. El CDC recomienda 2 dosis (12–15 meses y 4–6 años).",
    contraindications: ["inmunosupresion", "vih", "trasplante"],
    contraindicationNote: "Vacuna de virus vivos: contraindicada en inmunocomprometidos graves. Evaluar con especialista.",
  },
  {
    id: "hepa",
    name: "Hepatitis A",
    shortName: "HepA",
    description: "Protege contra el virus de hepatitis A, transmitido por agua y alimentos contaminados.",
    minAge: 1,
    maxAge: 999,
    sex: "all",
    priority: "recommended",
    source: "CDC",
    note: "Serie de 2 dosis con 6 meses de separación. No incluida en el cuadro básico universal SSA; disponible en clínica privada.",
    conditionTriggers: ["hepatica", "vih", "trasplante", "viajero"],
    conditionNote: "Recomendada por mayor riesgo de infección grave o complicaciones hepáticas.",
  },
  {
    id: "dpt-refuerzo",
    name: "DPT (refuerzo preescolar)",
    shortName: "DPT",
    description: "Refuerzo de protección contra difteria, tétanos y tosferina al ingreso escolar.",
    minAge: 4,
    maxAge: 6,
    sex: "all",
    priority: "routine",
    source: "SSA",
    note: "Dosis única a los 4 años. Gratuita en centros de salud SSA.",
  },

  // ── Adolescentes ─────────────────────────────────────────────────────────

  {
    id: "tdap",
    name: "Tdap / Td (tétanos y difteria adultos)",
    shortName: "Tdap / Td",
    description: "Refuerzo contra tétanos, difteria y tosferina para adolescentes y adultos.",
    minAge: 11,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    note: "Tdap a los 11–12 años; después Td o Tdap cada 10 años.",
    conditionTriggers: ["embarazo", "trabajador_salud"],
    conditionNote: "Embarazadas: Tdap en cada embarazo (semanas 27–36). Trabajadores de salud: actualizar cada 10 años.",
  },
  {
    id: "vph",
    name: "Virus del Papiloma Humano (VPH)",
    shortName: "VPH",
    description: "Previene los cánceres asociados a VPH: cuello uterino, anal, orofaríngeo y otros.",
    minAge: 9,
    maxAge: 26,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    note: "2 dosis si se inicia antes de los 15 años; 3 dosis si después. SSA lo ofrece gratis a niñas; CDC lo recomienda también a niños.",
    contraindications: ["embarazo"],
    contraindicationNote: "Diferir hasta después del parto.",
  },
  {
    id: "vph-shared",
    name: "VPH (27–45 años)",
    shortName: "VPH",
    description: "Puede ser útil en adultos no vacunados previamente. El beneficio depende de la exposición previa.",
    minAge: 27,
    maxAge: 45,
    sex: "all",
    priority: "shared-decision",
    source: "CDC",
    note: "Decisión compartida con el médico según historial de exposición.",
  },
  {
    id: "menacwy",
    name: "Meningococo ACWY",
    shortName: "MenACWY",
    description: "Protege contra meningitis bacteriana por serogrupos A, C, W e Y.",
    minAge: 11,
    maxAge: 21,
    sex: "all",
    priority: "recommended",
    source: "CDC",
    note: "Primera dosis 11–12 años; refuerzo a los 16. No está en el cuadro básico SSA; disponible en clínica privada.",
    conditionTriggers: ["asplenia", "vih", "inmunosupresion", "trasplante"],
    conditionNote: "Recomendada a cualquier edad por alto riesgo de infección grave.",
  },
  {
    id: "menb",
    name: "Meningococo B",
    shortName: "MenB",
    description: "Protege contra meningitis bacteriana por serogrupo B.",
    minAge: 16,
    maxAge: 23,
    sex: "all",
    priority: "recommended",
    source: "CDC",
    note: "Serie de 2–3 dosis. Edad preferida: 16–18 años. No está en el cuadro básico SSA.",
    conditionTriggers: ["asplenia", "vih", "inmunosupresion"],
    conditionNote: "Recomendada a cualquier edad por mayor susceptibilidad a infección meningocócica.",
  },
  {
    id: "hib-adult",
    name: "Haemophilus influenzae tipo b (adulto)",
    shortName: "Hib",
    description: "Protege contra infecciones invasivas graves por Hib como meningitis y bacteriemia.",
    minAge: 999,
    maxAge: 999,
    sex: "all",
    priority: "recommended",
    source: "CDC",
    conditionTriggers: ["asplenia", "trasplante", "inmunosupresion"],
    conditionNote: "Recomendada en adultos con asplenia o inmunosupresión grave. Consultar esquema con médico.",
  },

  // ── Adultos y adultos mayores ─────────────────────────────────────────────

  {
    id: "covid",
    name: "COVID-19",
    shortName: "COVID-19",
    description: "Protege contra enfermedad grave, hospitalización y muerte por SARS-CoV-2.",
    minAge: 6 / 12,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    annual: true,
    note: "Vacuna actualizada anualmente. Gratuita en centros de salud SSA.",
    conditionTriggers: ["diabetes", "renal", "hepatica", "cardiaca", "pulmonar", "vih", "inmunosupresion", "asplenia", "trasplante", "institucionalizado", "trabajador_salud"],
    conditionNote: "Alta prioridad. Mayor riesgo de enfermedad grave y muerte.",
  },
  {
    id: "pcv-adult",
    name: "Neumococo conjugada (adultos)",
    shortName: "PCV20",
    description: "Protege contra neumonía, meningitis y bacteriemia neumocócica.",
    minAge: 65,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "SSA+CDC",
    note: "1 dosis de PCV20, o PCV15 seguida de PPSV23 al año. Gratuita para adultos 60+ en centros de salud SSA.",
    conditionTriggers: ["diabetes", "renal", "hepatica", "cardiaca", "pulmonar", "vih", "inmunosupresion", "asplenia", "trasplante", "institucionalizado"],
    conditionNote: "Recomendada a cualquier edad por alto riesgo de infección neumocócica grave.",
  },
  {
    id: "zoster",
    name: "Herpes Zóster (Culebrilla)",
    shortName: "Shingrix",
    description: "Previene el herpes zóster y la neuralgia posherpética, complicación muy dolorosa y debilitante.",
    minAge: 50,
    maxAge: 999,
    sex: "all",
    priority: "routine",
    source: "CDC",
    note: "Serie de 2 dosis con 2–6 meses de separación. No está en el cuadro básico SSA; disponible en clínica privada.",
    conditionTriggers: ["vih", "inmunosupresion", "trasplante", "renal", "diabetes"],
    conditionNote: "Shingrix (recombinante) es segura incluso en inmunocomprometidos y se recomienda desde los 19 años en estas condiciones.",
  },
  {
    id: "rsv",
    name: "Virus Respiratorio Sincitial (RSV)",
    shortName: "RSV",
    description: "Reduce el riesgo de infección grave de las vías respiratorias inferiores por RSV.",
    minAge: 60,
    maxAge: 999,
    sex: "all",
    priority: "recommended",
    source: "CDC",
    note: "Dosis única. No disponible en el cuadro básico SSA.",
    conditionTriggers: ["cardiaca", "pulmonar", "embarazo"],
    conditionNote: "Embarazadas (32–36 semanas): protege al recién nacido en sus primeros meses. En adultos con enfermedad cardíaca o pulmonar: reduce hospitalización.",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

export function getRecommendations(
  ageYears: number,
  sex: "male" | "female",
  conditions: Condition[],
): VaccineResult[] {
  const results: VaccineResult[] = [];
  const seen = new Set<string>();

  for (const v of vaccines) {
    if (seen.has(v.id)) continue;

    const inAgeRange = ageYears >= v.minAge && ageYears <= v.maxAge;
    const sexMatch   = v.sex === "all" || v.sex === sex;
    const byCondition = v.conditionTriggers?.some((c) => conditions.includes(c)) ?? false;

    if (!sexMatch) continue;
    if (!inAgeRange && !byCondition) continue;

    seen.add(v.id);
    results.push({ ...v, triggeredByCondition: !inAgeRange && byCondition });
  }

  // Ordenar: rutinarias primero, luego recomendadas, luego decisión compartida
  const order: Priority[] = ["routine", "recommended", "shared-decision"];
  results.sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));

  return results;
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  "routine":         "Rutinaria",
  "recommended":     "Recomendada",
  "shared-decision": "Decisión compartida con el médico",
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  "routine":         "bg-green-100 text-green-800 border-green-200",
  "recommended":     "bg-blue-100 text-blue-800 border-blue-200",
  "shared-decision": "bg-amber-100 text-amber-800 border-amber-200",
};

export const SOURCE_LABEL: Record<Source, string> = {
  "SSA":     "Cuadro Básico SSA",
  "CDC":     "CDC",
  "SSA+CDC": "SSA + CDC",
};

export const SOURCE_COLOR: Record<Source, string> = {
  "SSA":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "CDC":     "bg-sky-50 text-sky-700 border-sky-200",
  "SSA+CDC": "bg-teal-50 text-teal-700 border-teal-200",
};
