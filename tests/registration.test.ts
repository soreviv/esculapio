import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

// Mock storage
vi.mock("../server/storage", () => {
  return {
    storage: {
      getUserByUsername: vi.fn(),
      createUser: vi.fn(),
      createAuditLog: vi.fn(),
    }
  };
});

describe("User Registration Flow", () => {
  let app: express.Express;
  let sessionData: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock session middleware
    sessionData = {
      userId: "admin-1",
      role: "admin",
      nombre: "Admin User",
    };

    app.use((req: any, _res, next) => {
      req.session = sessionData;
      next();
    });

    await registerRoutes({} as any, app);
  });

  describe("POST /api/register", () => {
    const validUser = {
      username: "newuser",
      password: "Tr0ub4dor&3#Horse!Battery", // Strong password
      role: "medico",
      nombre: "New Doctor",
      especialidad: "General",
      cedula: "123456"
    };

    it("should register a new user successfully when called by an admin", async () => {
      (storage.getUserByUsername as any).mockResolvedValue(null);
      (storage.createUser as any).mockResolvedValue({
        id: "user-123",
        username: "newuser",
        role: "medico",
        nombre: "New Doctor"
      });

      const res = await request(app)
        .post("/api/register")
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: "user-123",
        username: "newuser",
        role: "medico",
        nombre: "New Doctor"
      });

      expect(storage.createUser).toHaveBeenCalled();
      expect(storage.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        accion: "crear",
        entidad: "users",
        entidadId: "user-123"
      }));
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/register")
        .send({ username: "incomplete" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Username, password y nombre son requeridos");
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it("should return 400 for a weak password", async () => {
      const res = await request(app)
        .post("/api/register")
        .send({ ...validUser, password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("La contraseña no es suficientemente segura");
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it("should return 400 if username already exists", async () => {
      (storage.getUserByUsername as any).mockResolvedValue({ id: "existing-1" });

      const res = await request(app)
        .post("/api/register")
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("El usuario ya existe");
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it("should return 401 if not authenticated", async () => {
      // Clear session data to simulate unauthenticated
      sessionData.userId = undefined;

      const res = await request(app)
        .post("/api/register")
        .send(validUser);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("No autorizado. Por favor inicie sesión.");
    });

    it("should return 403 if authenticated but not an admin", async () => {
      sessionData.role = "medico";

      const res = await request(app)
        .post("/api/register")
        .send(validUser);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Acceso denegado. Se requieren permisos de administrador.");
    });
  });
});
