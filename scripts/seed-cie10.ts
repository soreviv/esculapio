/**
 * Script para sembrar el catálogo CIE-10 con diagnósticos comunes en México
 * Ejecutar con: npx tsx scripts/seed-cie10.ts
 */

import { db } from "../server/db";
import { cie10Catalog } from "../shared/schema";

const cie10Codes = [
  // Enfermedades infecciosas y parasitarias (A00-B99)
  { codigo: "A09", descripcion: "Diarrea y gastroenteritis de presunto origen infeccioso", categoria: "Infecciosas" },
  { codigo: "A15.0", descripcion: "Tuberculosis pulmonar confirmada bacteriológicamente", categoria: "Infecciosas" },
  { codigo: "A90", descripcion: "Fiebre del dengue [dengue clásico]", categoria: "Infecciosas" },
  { codigo: "A91", descripcion: "Fiebre del dengue hemorrágico", categoria: "Infecciosas" },
  { codigo: "B24", descripcion: "Enfermedad por virus de la inmunodeficiencia humana [VIH], sin otra especificación", categoria: "Infecciosas" },
  { codigo: "B34.9", descripcion: "Infección viral, no especificada", categoria: "Infecciosas" },
  
  // Tumores (C00-D48)
  { codigo: "C50.9", descripcion: "Tumor maligno de la mama, parte no especificada", categoria: "Tumores" },
  { codigo: "C53.9", descripcion: "Tumor maligno del cuello del útero, sin otra especificación", categoria: "Tumores" },
  { codigo: "C61", descripcion: "Tumor maligno de la próstata", categoria: "Tumores" },
  { codigo: "C34.9", descripcion: "Tumor maligno de bronquio o pulmón, parte no especificada", categoria: "Tumores" },
  { codigo: "D25.9", descripcion: "Leiomioma del útero, sin otra especificación", categoria: "Tumores" },
  
  // Enfermedades de la sangre (D50-D89)
  { codigo: "D50.9", descripcion: "Anemia por deficiencia de hierro, sin otra especificación", categoria: "Sangre" },
  { codigo: "D64.9", descripcion: "Anemia, no especificada", categoria: "Sangre" },
  
  // Enfermedades endocrinas, nutricionales y metabólicas (E00-E90)
  { codigo: "E03.9", descripcion: "Hipotiroidismo, no especificado", categoria: "Endocrinas" },
  { codigo: "E05.9", descripcion: "Tirotoxicosis, no especificada", categoria: "Endocrinas" },
  { codigo: "E10.9", descripcion: "Diabetes mellitus tipo 1, sin complicaciones", categoria: "Endocrinas" },
  { codigo: "E11.9", descripcion: "Diabetes mellitus tipo 2, sin complicaciones", categoria: "Endocrinas" },
  { codigo: "E11.65", descripcion: "Diabetes mellitus tipo 2 con hiperglucemia", categoria: "Endocrinas" },
  { codigo: "E11.21", descripcion: "Diabetes mellitus tipo 2 con nefropatía diabética", categoria: "Endocrinas" },
  { codigo: "E11.40", descripcion: "Diabetes mellitus tipo 2 con complicaciones neurológicas", categoria: "Endocrinas" },
  { codigo: "E14.9", descripcion: "Diabetes mellitus, no especificada, sin complicaciones", categoria: "Endocrinas" },
  { codigo: "E66.9", descripcion: "Obesidad, no especificada", categoria: "Endocrinas" },
  { codigo: "E66.0", descripcion: "Obesidad debida a exceso de calorías", categoria: "Endocrinas" },
  { codigo: "E78.0", descripcion: "Hipercolesterolemia pura", categoria: "Endocrinas" },
  { codigo: "E78.5", descripcion: "Hiperlipidemia, no especificada", categoria: "Endocrinas" },
  { codigo: "E87.6", descripcion: "Hipopotasemia", categoria: "Endocrinas" },
  
  // Trastornos mentales y del comportamiento (F00-F99)
  { codigo: "F32.9", descripcion: "Episodio depresivo, no especificado", categoria: "Mentales" },
  { codigo: "F33.9", descripcion: "Trastorno depresivo recurrente, no especificado", categoria: "Mentales" },
  { codigo: "F41.0", descripcion: "Trastorno de pánico", categoria: "Mentales" },
  { codigo: "F41.1", descripcion: "Trastorno de ansiedad generalizada", categoria: "Mentales" },
  { codigo: "F41.9", descripcion: "Trastorno de ansiedad, no especificado", categoria: "Mentales" },
  { codigo: "F10.1", descripcion: "Trastornos mentales y del comportamiento debidos al uso de alcohol: uso nocivo", categoria: "Mentales" },
  
  // Enfermedades del sistema nervioso (G00-G99)
  { codigo: "G40.9", descripcion: "Epilepsia, tipo no especificado", categoria: "Nervioso" },
  { codigo: "G43.9", descripcion: "Migraña, no especificada", categoria: "Nervioso" },
  { codigo: "G47.9", descripcion: "Trastorno del sueño, no especificado", categoria: "Nervioso" },
  { codigo: "G44.2", descripcion: "Cefalea tensional", categoria: "Nervioso" },
  
  // Enfermedades del ojo (H00-H59)
  { codigo: "H10.9", descripcion: "Conjuntivitis, no especificada", categoria: "Ojo" },
  { codigo: "H52.1", descripcion: "Miopía", categoria: "Ojo" },
  { codigo: "H40.9", descripcion: "Glaucoma, no especificado", categoria: "Ojo" },
  { codigo: "H26.9", descripcion: "Catarata, no especificada", categoria: "Ojo" },
  { codigo: "H25.9", descripcion: "Catarata senil, no especificada", categoria: "Ojo" },
  
  // Enfermedades del oído (H60-H95)
  { codigo: "H66.9", descripcion: "Otitis media, no especificada", categoria: "Oído" },
  { codigo: "H65.9", descripcion: "Otitis media no supurativa, sin otra especificación", categoria: "Oído" },
  
  // Enfermedades del sistema circulatorio (I00-I99)
  { codigo: "I10", descripcion: "Hipertensión esencial (primaria)", categoria: "Circulatorio" },
  { codigo: "I11.9", descripcion: "Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca", categoria: "Circulatorio" },
  { codigo: "I20.9", descripcion: "Angina de pecho, no especificada", categoria: "Circulatorio" },
  { codigo: "I21.9", descripcion: "Infarto agudo del miocardio, sin otra especificación", categoria: "Circulatorio" },
  { codigo: "I25.9", descripcion: "Enfermedad isquémica crónica del corazón, no especificada", categoria: "Circulatorio" },
  { codigo: "I48.9", descripcion: "Fibrilación y aleteo auricular, no especificados", categoria: "Circulatorio" },
  { codigo: "I50.9", descripcion: "Insuficiencia cardíaca, no especificada", categoria: "Circulatorio" },
  { codigo: "I63.9", descripcion: "Infarto cerebral, no especificado", categoria: "Circulatorio" },
  { codigo: "I64", descripcion: "Accidente vascular encefálico agudo, no especificado como hemorrágico o isquémico", categoria: "Circulatorio" },
  { codigo: "I83.9", descripcion: "Venas varicosas de los miembros inferiores sin úlcera ni inflamación", categoria: "Circulatorio" },
  
  // Enfermedades del sistema respiratorio (J00-J99)
  { codigo: "J00", descripcion: "Rinofaringitis aguda [resfriado común]", categoria: "Respiratorio" },
  { codigo: "J02.9", descripcion: "Faringitis aguda, no especificada", categoria: "Respiratorio" },
  { codigo: "J03.9", descripcion: "Amigdalitis aguda, no especificada", categoria: "Respiratorio" },
  { codigo: "J06.9", descripcion: "Infección aguda de las vías respiratorias superiores, no especificada", categoria: "Respiratorio" },
  { codigo: "J11.1", descripcion: "Influenza con otras manifestaciones respiratorias, virus no identificado", categoria: "Respiratorio" },
  { codigo: "J12.9", descripcion: "Neumonía viral, no especificada", categoria: "Respiratorio" },
  { codigo: "J15.9", descripcion: "Neumonía bacteriana, no especificada", categoria: "Respiratorio" },
  { codigo: "J18.9", descripcion: "Neumonía, no especificada", categoria: "Respiratorio" },
  { codigo: "J20.9", descripcion: "Bronquitis aguda, no especificada", categoria: "Respiratorio" },
  { codigo: "J30.4", descripcion: "Rinitis alérgica, no especificada", categoria: "Respiratorio" },
  { codigo: "J32.9", descripcion: "Sinusitis crónica, no especificada", categoria: "Respiratorio" },
  { codigo: "J40", descripcion: "Bronquitis, no especificada como aguda o crónica", categoria: "Respiratorio" },
  { codigo: "J44.9", descripcion: "Enfermedad pulmonar obstructiva crónica, no especificada", categoria: "Respiratorio" },
  { codigo: "J45.9", descripcion: "Asma, no especificada", categoria: "Respiratorio" },
  
  // Enfermedades del sistema digestivo (K00-K93)
  { codigo: "K21.0", descripcion: "Enfermedad de reflujo gastroesofágico con esofagitis", categoria: "Digestivo" },
  { codigo: "K25.9", descripcion: "Úlcera gástrica, no especificada como aguda ni crónica, sin hemorragia ni perforación", categoria: "Digestivo" },
  { codigo: "K29.7", descripcion: "Gastritis, no especificada", categoria: "Digestivo" },
  { codigo: "K30", descripcion: "Dispepsia funcional", categoria: "Digestivo" },
  { codigo: "K35.9", descripcion: "Apendicitis aguda, no especificada", categoria: "Digestivo" },
  { codigo: "K40.9", descripcion: "Hernia inguinal unilateral o no especificada, sin obstrucción ni gangrena", categoria: "Digestivo" },
  { codigo: "K52.9", descripcion: "Gastroenteritis y colitis no infecciosas, no especificadas", categoria: "Digestivo" },
  { codigo: "K58.9", descripcion: "Síndrome del intestino irritable sin diarrea", categoria: "Digestivo" },
  { codigo: "K59.0", descripcion: "Constipación", categoria: "Digestivo" },
  { codigo: "K70.3", descripcion: "Cirrosis hepática alcohólica", categoria: "Digestivo" },
  { codigo: "K74.6", descripcion: "Otras cirrosis del hígado y las no especificadas", categoria: "Digestivo" },
  { codigo: "K80.2", descripcion: "Cálculo de la vesícula biliar sin colecistitis", categoria: "Digestivo" },
  { codigo: "K81.0", descripcion: "Colecistitis aguda", categoria: "Digestivo" },
  { codigo: "K92.2", descripcion: "Hemorragia gastrointestinal, no especificada", categoria: "Digestivo" },
  
  // Enfermedades de la piel (L00-L99)
  { codigo: "L02.9", descripcion: "Absceso cutáneo, forúnculo y carbunco, sitio no especificado", categoria: "Piel" },
  { codigo: "L20.9", descripcion: "Dermatitis atópica, no especificada", categoria: "Piel" },
  { codigo: "L23.9", descripcion: "Dermatitis alérgica de contacto, de causa no especificada", categoria: "Piel" },
  { codigo: "L30.9", descripcion: "Dermatitis, no especificada", categoria: "Piel" },
  { codigo: "L40.9", descripcion: "Psoriasis, no especificada", categoria: "Piel" },
  { codigo: "L50.9", descripcion: "Urticaria, no especificada", categoria: "Piel" },
  
  // Enfermedades del sistema osteomuscular (M00-M99)
  { codigo: "M15.9", descripcion: "Poliartrosis, no especificada", categoria: "Osteomuscular" },
  { codigo: "M17.9", descripcion: "Gonartrosis, no especificada", categoria: "Osteomuscular" },
  { codigo: "M19.9", descripcion: "Artrosis, no especificada", categoria: "Osteomuscular" },
  { codigo: "M25.5", descripcion: "Dolor articular", categoria: "Osteomuscular" },
  { codigo: "M54.2", descripcion: "Cervicalgia", categoria: "Osteomuscular" },
  { codigo: "M54.5", descripcion: "Lumbago no especificado", categoria: "Osteomuscular" },
  { codigo: "M54.9", descripcion: "Dorsalgia, no especificada", categoria: "Osteomuscular" },
  { codigo: "M79.1", descripcion: "Mialgia", categoria: "Osteomuscular" },
  { codigo: "M79.3", descripcion: "Paniculitis, no especificada", categoria: "Osteomuscular" },
  
  // Enfermedades del sistema genitourinario (N00-N99)
  { codigo: "N18.9", descripcion: "Enfermedad renal crónica, no especificada", categoria: "Genitourinario" },
  { codigo: "N20.0", descripcion: "Cálculo del riñón", categoria: "Genitourinario" },
  { codigo: "N30.0", descripcion: "Cistitis aguda", categoria: "Genitourinario" },
  { codigo: "N39.0", descripcion: "Infección de vías urinarias, sitio no especificado", categoria: "Genitourinario" },
  { codigo: "N40", descripcion: "Hiperplasia de la próstata", categoria: "Genitourinario" },
  { codigo: "N76.0", descripcion: "Vaginitis aguda", categoria: "Genitourinario" },
  { codigo: "N92.6", descripcion: "Menstruación irregular, no especificada", categoria: "Genitourinario" },
  
  // Embarazo, parto y puerperio (O00-O99)
  { codigo: "O03.9", descripcion: "Aborto espontáneo, completo o no especificado, sin complicación", categoria: "Embarazo" },
  { codigo: "O20.0", descripcion: "Amenaza de aborto", categoria: "Embarazo" },
  { codigo: "O26.9", descripcion: "Afección relacionada con el embarazo, no especificada", categoria: "Embarazo" },
  { codigo: "O80", descripcion: "Parto único espontáneo", categoria: "Embarazo" },
  { codigo: "O82.0", descripcion: "Parto por cesárea electiva", categoria: "Embarazo" },
  
  // Síntomas, signos y hallazgos anormales (R00-R99)
  { codigo: "R05", descripcion: "Tos", categoria: "Síntomas" },
  { codigo: "R10.4", descripcion: "Otros dolores abdominales y los no especificados", categoria: "Síntomas" },
  { codigo: "R11", descripcion: "Náusea y vómito", categoria: "Síntomas" },
  { codigo: "R50.9", descripcion: "Fiebre, no especificada", categoria: "Síntomas" },
  { codigo: "R51", descripcion: "Cefalea", categoria: "Síntomas" },
  { codigo: "R53", descripcion: "Malestar y fatiga", categoria: "Síntomas" },
  { codigo: "R55", descripcion: "Síncope y colapso", categoria: "Síntomas" },
  { codigo: "R73.9", descripcion: "Hiperglucemia, no especificada", categoria: "Síntomas" },
  
  // Traumatismos y envenenamientos (S00-T98)
  { codigo: "S00.9", descripcion: "Traumatismo superficial de la cabeza, parte no especificada", categoria: "Traumatismos" },
  { codigo: "S06.0", descripcion: "Conmoción cerebral", categoria: "Traumatismos" },
  { codigo: "S52.9", descripcion: "Fractura del antebrazo, parte no especificada", categoria: "Traumatismos" },
  { codigo: "S62.6", descripcion: "Fractura de otro dedo de la mano", categoria: "Traumatismos" },
  { codigo: "S82.9", descripcion: "Fractura de la pierna, parte no especificada", categoria: "Traumatismos" },
  { codigo: "S93.4", descripcion: "Esguince y torcedura del tobillo", categoria: "Traumatismos" },
  { codigo: "T14.9", descripcion: "Traumatismo, no especificado", categoria: "Traumatismos" },
  { codigo: "T78.4", descripcion: "Alergia no especificada", categoria: "Traumatismos" },
  
  // Factores que influyen en el estado de salud (Z00-Z99)
  { codigo: "Z00.0", descripcion: "Examen médico general", categoria: "Factores" },
  { codigo: "Z01.0", descripcion: "Examen de ojos y de la visión", categoria: "Factores" },
  { codigo: "Z23", descripcion: "Necesidad de inmunización contra enfermedad bacteriana única", categoria: "Factores" },
  { codigo: "Z30.0", descripcion: "Consejo y asesoramiento general sobre la anticoncepción", categoria: "Factores" },
  { codigo: "Z34.9", descripcion: "Supervisión de embarazo normal, no especificado", categoria: "Factores" },
  { codigo: "Z76.0", descripcion: "Consulta para repetición de receta", categoria: "Factores" },
  { codigo: "Z96.6", descripcion: "Presencia de implante ortopédico articular", categoria: "Factores" },
];

async function seedCie10() {
  console.log("🏥 Iniciando carga del catálogo CIE-10...\n");

  try {
    // Insertar códigos en lotes
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < cie10Codes.length; i += batchSize) {
      const batch = cie10Codes.slice(i, i + batchSize);
      
      await db
        .insert(cie10Catalog)
        .values(batch)
        .onConflictDoNothing();
      
      inserted += batch.length;
      console.log(`  ✓ Insertados ${inserted}/${cie10Codes.length} códigos`);
    }

    console.log(`\n✅ Catálogo CIE-10 cargado exitosamente`);
    console.log(`   Total de códigos: ${cie10Codes.length}`);
    console.log(`   Categorías incluidas:`);
    
    const categorias = [...new Set(cie10Codes.map(c => c.categoria))];
    categorias.forEach(cat => {
      const count = cie10Codes.filter(c => c.categoria === cat).length;
      console.log(`     - ${cat}: ${count} códigos`);
    });

  } catch (error) {
    console.error("❌ Error al cargar catálogo CIE-10:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedCie10();
