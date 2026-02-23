import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { userToPractitioner, patientToFhir } from "./fhir-mappers";
import type { User, Patient } from "./schema";

describe("FHIR Mappers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("userToPractitioner", () => {
    const mockUser: User = {
      id: "user-123",
      username: "drsmith",
      password: "hashedpassword",
      role: "medico",
      nombre: "Dr. John Smith",
      especialidad: null,
      cedula: null,
      createdAt: new Date("2024-01-01T12:00:00Z"),
    };

    it("should map basic user fields correctly", () => {
      const now = new Date("2024-05-20T10:00:00Z");
      vi.setSystemTime(now);

      const result = userToPractitioner(mockUser);

      expect(result.resourceType).toBe("Practitioner");
      expect(result.id).toBe(mockUser.id);
      expect(result.active).toBe(true);
      expect(result.meta?.lastUpdated).toBe(now.toISOString());
      expect(result.name).toHaveLength(1);
      expect(result.name![0]).toEqual({
        use: "official",
        text: mockUser.nombre,
      });
    });

    it("should map user with professional ID (cedula) correctly", () => {
      const userWithCedula = { ...mockUser, cedula: "1234567" };
      const result = userToPractitioner(userWithCedula);

      expect(result.identifier).toContainEqual({
        use: "official",
        system: "urn:oid:2.16.840.1.113883.3.215",
        value: "1234567",
      });
    });

    it("should map user with specialty (especialidad) correctly", () => {
      const userWithSpecialty = { ...mockUser, especialidad: "Cardiología" };
      const result = userToPractitioner(userWithSpecialty);

      expect(result.qualification).toHaveLength(1);
      expect(result.qualification![0].code.text).toBe("Cardiología");
    });

    it("should map user with both cedula and specialty correctly", () => {
      const fullUser = {
        ...mockUser,
        cedula: "1234567",
        especialidad: "Cardiología",
      };
      const result = userToPractitioner(fullUser);

      expect(result.identifier).toContainEqual({
        use: "official",
        system: "urn:oid:2.16.840.1.113883.3.215",
        value: "1234567",
      });
      expect(result.qualification![0].code.text).toBe("Cardiología");
    });
  });

  describe("patientToFhir", () => {
    const mockPatient: Patient = {
      id: "patient-123",
      numeroExpediente: "EXP-001",
      nombre: "Jane",
      apellidoPaterno: "Doe",
      apellidoMaterno: "Smith",
      curp: "DOES900101HDFRRL01",
      fechaNacimiento: "1990-01-01",
      sexo: "F",
      grupoSanguineo: "O+",
      telefono: "5551234567",
      email: "jane.doe@example.com",
      direccion: "Main St 123",
      ocupacion: "Software Engineer",
      estadoCivil: "Soltera",
      escolaridad: "Licenciatura",
      religion: "Ninguna",
      lugarNacimiento: "CDMX",
      antecedentesHeredoFamiliares: null,
      antecedentesPersonalesPatologicos: null,
      antecedentesPersonalesNoPatologicos: null,
      antecedentesGinecoObstetricos: null,
      alergias: ["Pollen"],
      contactoEmergencia: "John Doe",
      telefonoEmergencia: "5559876543",
      status: "activo",
      createdAt: new Date("2024-01-01T12:00:00Z"),
    };

    it("should map basic patient fields correctly", () => {
      const result = patientToFhir(mockPatient);

      expect(result.resourceType).toBe("Patient");
      expect(result.id).toBe(mockPatient.id);
      expect(result.active).toBe(true);
      expect(result.gender).toBe("female");
      expect(result.birthDate).toBe(mockPatient.fechaNacimiento);
    });

    it("should map patient identifiers correctly", () => {
      const result = patientToFhir(mockPatient);

      expect(result.identifier).toContainEqual({
        use: "official",
        system: "http://salud-digital.mx/fhir/expediente",
        value: mockPatient.numeroExpediente,
      });
      expect(result.identifier).toContainEqual({
        use: "official",
        system: "urn:oid:2.16.840.1.113883.4.629",
        value: mockPatient.curp,
      });
    });

    it("should map patient name correctly", () => {
      const result = patientToFhir(mockPatient);

      expect(result.name).toHaveLength(1);
      expect(result.name![0]).toEqual({
        use: "official",
        family: "Doe Smith",
        given: ["Jane"],
        text: "Jane Doe Smith",
      });
    });

    it("should map patient status to active correctly", () => {
      const inactivePatient = { ...mockPatient, status: "inactivo" };
      const result = patientToFhir(inactivePatient);
      expect(result.active).toBe(false);
    });
  });
});
