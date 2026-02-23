
import { describe, it, expect } from "vitest";
import { isSensitivePath, redactSensitiveData } from "../server/logging-utils";

describe("Logging Utilities", () => {
  describe("isSensitivePath", () => {
    it("should identify sensitive paths", () => {
      expect(isSensitivePath("/api/patients")).toBe(true);
      expect(isSensitivePath("/api/patients/123")).toBe(true);
      expect(isSensitivePath("/api/notes")).toBe(true);
      expect(isSensitivePath("/fhir/Patient")).toBe(true);
    });

    it("should return false for non-sensitive paths", () => {
      expect(isSensitivePath("/api/public-info")).toBe(false);
      expect(isSensitivePath("/assets/logo.png")).toBe(false);
      expect(isSensitivePath("/login")).toBe(false);
    });
  });

  describe("redactSensitiveData", () => {
    it("should redact sensitive fields at the top level", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        password: "secretpassword",
        role: "user",
      };
      const redacted = redactSensitiveData(data);
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.email).toBe("[REDACTED]");
      expect(redacted.role).toBe("user");
      expect(redacted.name).toBe("John Doe"); // "nombre" is in patterns? Check patterns.
      // Patterns: /nombre/i matches "name"? NO.
      // Wait, "nombre" matches "nombre", NOT "name".
      // But "password" matches "password".
      // "email" matches "email".
      // "name" doesn't match "nombre".
    });

    it("should redact sensitive fields based on Spanish patterns", () => {
       const data = {
         telefono: "555-1234",
         direccion: "Calle Falsa 123",
         curp: "ABC123456",
         fechaNacimiento: "2000-01-01",
       };
       const redacted = redactSensitiveData(data);
       expect(redacted.telefono).toBe("[REDACTED]");
       expect(redacted.direccion).toBe("[REDACTED]");
       expect(redacted.curp).toBe("[REDACTED]");
       expect(redacted.fechaNacimiento).toBe("[REDACTED]");
    });

    it("should redact sensitive fields in nested objects", () => {
      const data = {
        user: {
          username: "jdoe",
          password: "password123",
          profile: {
            direccion: "123 Main St",
          },
        },
      };
      const redacted = redactSensitiveData(data);
      expect(redacted.user.password).toBe("[REDACTED]");
      expect(redacted.user.profile.direccion).toBe("[REDACTED]");
    });

    it("should handle arrays of objects", () => {
      const data = [
        { id: 1, password: "p1" },
        { id: 2, password: "p2" },
      ];
      const redacted = redactSensitiveData(data);
      expect(redacted[0].password).toBe("[REDACTED]");
      expect(redacted[1].password).toBe("[REDACTED]");
      expect(redacted[0].id).toBe(1);
    });

    it("should handle null and undefined", () => {
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
    });

    it("should handle deep nesting up to limit", () => {
      const deep: any = { level: 0, next: {} };
      let current = deep;
      // create depth > 10
      for (let i = 0; i < 15; i++) {
        current.next = { level: i + 1, next: {} };
        current = current.next;
      }

      const redacted = redactSensitiveData(deep);
      // It should stop redacting/recurring around depth 10
      // redactSensitiveData(data, depth=0)
      // depth 0: level 0
      // depth 1: level 1
      // ...
      // depth 10: level 10 -> returns [MAX_DEPTH]

      // So let's check deep.next...
      let check = redacted;
      let depth = 0;
      while (check && typeof check === 'object' && depth <= 12) { // check a bit past 10
          if (check === "[MAX_DEPTH]") {
              break;
          }
          check = check.next;
          depth++;
      }
      expect(check).toBe("[MAX_DEPTH]");
      expect(depth).toBeGreaterThanOrEqual(10);
    });
  });
});
