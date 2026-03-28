import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Use an environment variable for the encryption key.
// In production, ENCRYPTION_KEY is required — the server will refuse to start without it.
const algorithm = "aes-256-gcm";
const password = ((): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    return key;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY environment variable is required in production to ensure data security.");
  }

  console.warn("WARNING: No ENCRYPTION_KEY provided in development. Using default development key. This is NOT secure for production use.");
  return "salud-digital-development-key-default-32";
})();

// Use a configurable KDF salt. In production, set ENCRYPTION_KDF_SALT to a unique,
// high-entropy value. A static but non-trivial default is used in development only.
const kdfSalt = ((): string => {
  const envSalt = process.env.ENCRYPTION_KDF_SALT;
  if (envSalt) {
    return envSalt;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KDF_SALT environment variable is required in production to ensure data security.");
  }

  return "salud-digital-kdf-salt-dev-only-32x";
})();

// Derive the 32-byte AES-256 key from the password using scrypt.
const encryptionKey = scryptSync(password, kdfSalt, 32);

export function encrypt(text: string): string {
  if (!text) return text;

  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, encryptionKey, iv);

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
    const decipher = createDecipheriv(algorithm, encryptionKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed: data may be corrupt or the key has changed");
  }
}
