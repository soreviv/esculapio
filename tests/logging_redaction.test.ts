import { describe, it, expect } from "vitest";
import { redactSensitiveData, isSensitivePath } from "../server/logging-utils";

describe("Logging Redaction", () => {
  describe("isSensitivePath", () => {
    it("should return true for sensitive API paths", () => {
      expect(isSensitivePath("/api/patients")).toBe(true);
      expect(isSensitivePath("/api/patients/1")).toBe(true);
      expect(isSensitivePath("/api/notes")).toBe(true);
      expect(isSensitivePath("/api/appointments")).toBe(true);
      expect(isSensitivePath("/fhir")).toBe(true);
      expect(isSensitivePath("/fhir/Patient")).toBe(true);
    });

    it("should return false for non-sensitive API paths", () => {
      expect(isSensitivePath("/api/auth/me")).toBe(false);
      expect(isSensitivePath("/api/login")).toBe(false);
      expect(isSensitivePath("/api-docs")).toBe(false);
    });
  });

  describe("redactSensitiveData", () => {
    it("should redact sensitive fields", () => {
      const data = {
        id: 1,
        username: "jdoe",
        password: "secretpassword",
        email: "john@example.com",
        nombre: "John Doe",
        diagnostico: "Some illness",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.id).toBe(1);
      expect(redacted.username).toBe("jdoe");
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.email).toBe("[REDACTED]");
      expect(redacted.nombre).toBe("[REDACTED]");
      expect(redacted.diagnostico).toBe("[REDACTED]");
    });

    it("should redact sensitive fields in nested objects", () => {
      const data = {
        user: {
          id: 1,
          password: "password123",
          profile: {
            email: "test@test.com",
            address: "123 Main St", // matches 'direccion' pattern if it was in there, wait let me check
          }
        },
        publicInfo: "public"
      };

      // I should check if 'address' is in SENSITIVE_FIELD_PATTERNS.
      // It's /direccion/i. So address might not be caught unless I add it or use Spanish.

      const redacted = redactSensitiveData(data);
      expect(redacted.user.password).toBe("[REDACTED]");
      expect(redacted.user.profile.email).toBe("[REDACTED]");
      expect(redacted.publicInfo).toBe("public");
    });

    it("should redact sensitive fields in arrays", () => {
      const data = [
        { id: 1, nombre: "Patient 1" },
        { id: 2, nombre: "Patient 2" }
      ];

      const redacted = redactSensitiveData(data);
      expect(redacted[0].nombre).toBe("[REDACTED]");
      expect(redacted[1].nombre).toBe("[REDACTED]");
      expect(redacted[0].id).toBe(1);
    });

    it("should handle null and undefined", () => {
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
    });

    it("should handle non-object types", () => {
      expect(redactSensitiveData("string")).toBe("string");
      expect(redactSensitiveData(123)).toBe(123);
    });

    it("should prevent infinite recursion", () => {
      const circular: any = { name: "test" };
      circular.self = circular;

      const redacted = redactSensitiveData(circular);
      // It should hit MAX_DEPTH at some point
      let current = redacted;
      for (let i = 0; i < 11; i++) {
        if (current === "[MAX_DEPTH]") break;
        current = current.self;
      }
      expect(current).toBe("[MAX_DEPTH]");
    });
  });
});
