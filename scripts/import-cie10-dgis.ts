/**
 * Script para importar el catálogo CIE-10 completo desde el archivo oficial de la
 * Dirección General de Información en Salud (DGIS) - SSA México
 * Archivo: DIAGNOSTICOS_20240416.xlsx (Abril 2024)
 *
 * Ejecutar con: npx tsx scripts/import-cie10-dgis.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { db } from "../server/db";
import { cie10Catalog } from "../shared/schema";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../attached_assets/DIAGNOSTICOS_20240416.xlsx");

// Mapeo de número romano de capítulo a categoría legible
const CAPITULO_MAP: Record<string, string> = {
  I: "Infecciosas",
  II: "Tumores",
  III: "Sangre",
  IV: "Endocrinas",
  V: "Mentales",
  VI: "Nervioso",
  VII: "Ojo",
  VIII: "Oído",
  IX: "Circulatorio",
  X: "Respiratorio",
  XI: "Digestivo",
  XII: "Piel",
  XIII: "Osteomuscular",
  XIV: "Genitourinario",
  XV: "Embarazo",
  XVI: "Perinatal",
  XVII: "Congénitas",
  XVIII: "Síntomas",
  XIX: "Traumatismos",
  XX: "Causas externas",
  XXI: "Factores de salud",
  XXII: "Especiales",
};

interface Row {
  CATALOG_KEY: string;
  NOMBRE: string;
  CLAVE_CAPITULO: string;
  CAPITULO: string;
  LETRA: string;
}

async function importCie10() {
  console.log("🏥 Importando catálogo CIE-10 DGIS (Abril 2024)...\n");

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ Archivo no encontrado: ${XLSX_PATH}`);
    process.exit(1);
  }

  // Leer el archivo XLSX
  console.log("📂 Leyendo archivo XLSX...");
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["CIE-ABRIL-2024"];

  if (!ws) {
    console.error("❌ Hoja 'CIE-ABRIL-2024' no encontrada");
    process.exit(1);
  }

  const rawData: Row[] = XLSX.utils.sheet_to_json(ws);
  console.log(`   Total de registros en archivo: ${rawData.length}\n`);

  // Transformar datos al formato del schema
  const codes = rawData
    .filter((row) => row.CATALOG_KEY && row.NOMBRE)
    .map((row) => {
      const claveCapitulo = (row.CLAVE_CAPITULO || "").toString().trim();
      const categoria = CAPITULO_MAP[claveCapitulo] || row.CAPITULO || "General";

      return {
        codigo: row.CATALOG_KEY.toString().trim(),
        descripcion: row.NOMBRE.toString().trim(),
        categoria,
      };
    })
    // Eliminar duplicados por código
    .filter((item, index, self) => self.findIndex((t) => t.codigo === item.codigo) === index);

  console.log(`📊 Códigos a importar: ${codes.length}`);

  // Insertar en lotes de 500
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);

    await db.insert(cie10Catalog).values(batch).onConflictDoNothing();

    inserted += batch.length;
    const pct = Math.round((inserted / codes.length) * 100);
    process.stdout.write(`\r  ✓ Procesados: ${inserted}/${codes.length} (${pct}%)`);
  }

  console.log("\n");

  // Resumen por categoría
  const categorias = [...new Set(codes.map((c) => c.categoria))].sort();
  console.log("✅ Importación completada.\n");
  console.log(`📋 Resumen por categoría:`);
  categorias.forEach((cat) => {
    const count = codes.filter((c) => c.categoria === cat).length;
    console.log(`   - ${cat}: ${count} códigos`);
  });
  console.log(`\n   Total importado: ${codes.length} códigos`);

  process.exit(0);
}

importCie10().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
