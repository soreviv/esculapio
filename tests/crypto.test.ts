
import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../server/crypto";

describe("Crypto Utilities", () => {
  describe("encrypt", () => {
    it("should return the same value if input is empty or null", () => {
      expect(encrypt("")).toBe("");
      // @ts-ignore - testing runtime behavior for non-string
      expect(encrypt(null)).toBe(null);
      // @ts-ignore
      expect(encrypt(undefined)).toBe(undefined);
    });

    it("should return a string in the format iv:authTag:encryptedData", () => {
      const text = "Hello World";
      const encrypted = encrypt(text);
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    });

    it("should produce different results for the same input (random IV)", () => {
      const text = "Hello World";
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe("decrypt", () => {
    it("should return the original text after encryption and decryption", () => {
      const originalText = "Sensitive Medical Data 123";
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it("should return the same value if input is empty or does not contain a colon", () => {
      expect(decrypt("")).toBe("");
      expect(decrypt("plain-text")).toBe("plain-text");
      // @ts-ignore
      expect(decrypt(null)).toBe(null);
    });

    it("should return error message when decryption fails (tampered data)", () => {
      const text = "Secret";
      const encrypted = encrypt(text);
      const parts = encrypted.split(":");

      // Tamper with the encrypted payload part - change one character but keep same length
      const payload = parts[2];
      const tamperedPayload = (payload[0] === '0' ? '1' : '0') + payload.substring(1);
      const tamperedData = `${parts[0]}:${parts[1]}:${tamperedPayload}`;

      const result = decrypt(tamperedData);
      expect(result).toBe("Error al desencriptar datos");
    });

    it("should return error message when auth tag is tampered", () => {
      const text = "Secret";
      const encrypted = encrypt(text);
      const parts = encrypted.split(":");

      // Tamper with the auth tag part - change one character but keep same length
      const tag = parts[1];
      const tamperedTag = (tag[0] === '0' ? '1' : '0') + tag.substring(1);
      const tamperedData = `${parts[0]}:${tamperedTag}:${parts[2]}`;

      const result = decrypt(tamperedData);
      expect(result).toBe("Error al desencriptar datos");
    });

    it("should handle invalid hex strings gracefully", () => {
      const invalidHex = "not-hex:not-hex:not-hex";
      const result = decrypt(invalidHex);
      expect(result).toBe("Error al desencriptar datos");
    });
  });
});
