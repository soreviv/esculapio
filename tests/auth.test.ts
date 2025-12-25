import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength, isAuthenticated, isAdmin, isMedico, isEnfermeria, isMedicoOrEnfermeria } from "../server/auth";
import type { Request, Response, NextFunction } from "express";

describe("Password Hashing", () => {
  it("should hash a password and verify it correctly", async () => {
    const password = "SecurePassword123!";
    const hashedPassword = await hashPassword(password);
    
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toMatch(/^\$2[ab]\$/);
    
    const isValid = await verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  it("should return false for incorrect password", async () => {
    const password = "SecurePassword123!";
    const wrongPassword = "WrongPassword456!";
    const hashedPassword = await hashPassword(password);
    
    const isValid = await verifyPassword(wrongPassword, hashedPassword);
    expect(isValid).toBe(false);
  });

  it("should generate different hashes for the same password", async () => {
    const password = "SecurePassword123!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    expect(hash1).not.toBe(hash2);
  });
});

describe("Authentication Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      session: {},
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();
  });

  describe("isAuthenticated", () => {
    it("should call next() when user is authenticated", () => {
      mockReq.session = { userId: "user-123", role: "medico", nombre: "Dr. Test" } as any;
      
      isAuthenticated(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", () => {
      mockReq.session = {} as any;
      
      isAuthenticated(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "No autorizado. Por favor inicie sesión." });
    });
  });

  describe("isAdmin", () => {
    it("should call next() when user is admin", () => {
      mockReq.session = { userId: "admin-1", role: "admin", nombre: "Admin" } as any;
      
      isAdmin(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 403 when user is not admin", () => {
      mockReq.session = { userId: "user-1", role: "medico", nombre: "Dr. Test" } as any;
      
      isAdmin(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe("isMedico", () => {
    it("should call next() when user is medico", () => {
      mockReq.session = { userId: "doc-1", role: "medico", nombre: "Dr. Test" } as any;
      
      isMedico(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next() when user is admin (admin has medico access)", () => {
      mockReq.session = { userId: "admin-1", role: "admin", nombre: "Admin" } as any;
      
      isMedico(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 403 when user is enfermeria (insufficient permissions)", () => {
      mockReq.session = { userId: "nurse-1", role: "enfermeria", nombre: "Nurse Test" } as any;
      
      isMedico(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe("isMedicoOrEnfermeria", () => {
    it("should call next() when user is medico", () => {
      mockReq.session = { userId: "doc-1", role: "medico", nombre: "Dr. Test" } as any;
      
      isMedicoOrEnfermeria(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next() when user is enfermeria", () => {
      mockReq.session = { userId: "nurse-1", role: "enfermeria", nombre: "Nurse Test" } as any;
      
      isMedicoOrEnfermeria(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next() when user is admin", () => {
      mockReq.session = { userId: "admin-1", role: "admin", nombre: "Admin" } as any;
      
      isMedicoOrEnfermeria(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 403 for unauthorized role", () => {
      mockReq.session = { userId: "receptionist-1", role: "recepcion", nombre: "Receptionist" } as any;
      
      isMedicoOrEnfermeria(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });
});

describe("Password Strength Validation (zxcvbn)", () => {
  it("should reject weak passwords (score < 3)", () => {
    const result = validatePasswordStrength("password");
    expect(result.valid).toBe(false);
    expect(result.score).toBeLessThan(3);
  });

  it("should reject common passwords", () => {
    const result = validatePasswordStrength("123456");
    expect(result.valid).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should accept strong passwords (score >= 3)", () => {
    const result = validatePasswordStrength("Tr0ub4dor&3#Horse!Battery");
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("should penalize passwords containing user information", () => {
    const resultWithoutInputs = validatePasswordStrength("DrJuanPerez2024!");
    const resultWithInputs = validatePasswordStrength("DrJuanPerez2024!", ["DrJuanPerez", "juan.perez@hospital.mx"]);
    expect(resultWithInputs.score).toBeLessThanOrEqual(resultWithoutInputs.score);
  });

  it("should provide feedback for weak passwords", () => {
    const result = validatePasswordStrength("password123");
    expect(result.valid).toBe(false);
    expect(result.feedback).toBeDefined();
    expect(result.crackTimeDisplay).toBeDefined();
  });

  it("should return crack time estimate", () => {
    const result = validatePasswordStrength("SecureP@ssw0rd!Complex");
    expect(result.crackTimeDisplay).toBeDefined();
    expect(typeof result.crackTimeDisplay).toBe("string");
  });
});
