#!/usr/bin/env node
/**
 * setup-env.js — Inicialización de variables de entorno seguras
 *
 * Genera SESSION_SECRET y ENCRYPTION_KEY si no están definidas en .env.
 * Seguro de ejecutar múltiples veces: nunca sobreescribe valores existentes.
 *
 * Uso: node script/setup-env.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ENV_PATH = path.resolve(__dirname, "../.env");

// --- Leer .env actual ---
let content = "";
if (fs.existsSync(ENV_PATH)) {
  content = fs.readFileSync(ENV_PATH, "utf8");
} else {
  console.log(".env no encontrado, se creará uno nuevo.");
}

let changed = false;

function ensureKey(key, generator) {
  const regex = new RegExp(`^${key}=(.+)$`, "m");
  const match = content.match(regex);

  if (match && match[1].trim() && match[1].trim() !== "salud-digital-development-key-default-32") {
    console.log(`✓ ${key} ya configurado.`);
    return;
  }

  const value = generator();

  if (match) {
    // Reemplazar valor existente (era vacío o era la clave de desarrollo)
    content = content.replace(regex, `${key}=${value}`);
    console.log(`✓ ${key} actualizado con valor seguro.`);
  } else {
    // Agregar al final
    content += `\n${key}=${value}`;
    console.log(`✓ ${key} generado y agregado.`);
  }

  changed = true;
}

ensureKey("SESSION_SECRET", () => crypto.randomBytes(64).toString("hex"));
ensureKey("ENCRYPTION_KEY", () => crypto.randomBytes(32).toString("hex"));

if (changed) {
  fs.writeFileSync(ENV_PATH, content, "utf8");
  console.log("\n.env actualizado. Copia los valores nuevos a ecosystem.config.cjs antes de iniciar el servidor.\n");

  // Mostrar los valores generados para que el usuario los copie al ecosystem
  const sessionMatch = content.match(/^SESSION_SECRET=(.+)$/m);
  const encryptionMatch = content.match(/^ENCRYPTION_KEY=(.+)$/m);
  if (sessionMatch) console.log(`  SESSION_SECRET=${sessionMatch[1]}`);
  if (encryptionMatch) console.log(`  ENCRYPTION_KEY=${encryptionMatch[1]}`);
} else {
  console.log("\nTodo ya estaba configurado. No se realizaron cambios.");
}
