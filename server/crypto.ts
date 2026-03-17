import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Use an environment variable for the encryption key.
// In production, ENCRYPTION_KEY is required — the server will refuse to start without it.
const algorithm = "aes-256-gcm";
const encryptionKey = process.env.ENCRYPTION_KEY;
if (!encryptionKey && process.env.NODE_ENV === "production") {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required in production. " +
    "Set it to a secure 32-character string before starting the server."
  );
}
if (!encryptionKey) {
  console.warn(
    "[WARN] ENCRYPTION_KEY not set — using insecure development fallback. " +
    "This MUST be configured before deploying to production."
  );
}
const password = encryptionKey || "salud-digital-development-key-default-32";
const salt = scryptSync(password, "salt", 32);

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, salt, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(":")) return encryptedData;
  
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(":");
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(algorithm, salt, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "Error al desencriptar datos";
  }
}
