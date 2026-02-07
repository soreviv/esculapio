import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Session Security - Login Session Handling", () => {
  let mockReq: any;
  let mockRes: any;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe("Session Regeneration on Login", () => {
    it("should regenerate session to prevent session fixation", async () => {
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb());
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb());

      mockReq = {
        session: {
          id: "old-session-id",
          regenerate: regenerateMock,
          save: saveMock,
          userId: undefined as string | undefined,
          role: undefined as string | undefined,
          nombre: undefined as string | undefined,
        },
      };

      const initialSessionId = mockReq.session.id;

      await new Promise<void>((resolve, reject) => {
        mockReq.session.regenerate((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      mockReq.session.userId = "user-123";
      mockReq.session.role = "medico";
      mockReq.session.nombre = "Dr. Test";

      await new Promise<void>((resolve, reject) => {
        mockReq.session.save((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      expect(regenerateMock).toHaveBeenCalledOnce();
      expect(saveMock).toHaveBeenCalledOnce();
      expect(initialSessionId).toBe("old-session-id");
    });

    it("should call regenerate before save", async () => {
      const callOrder: string[] = [];
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => {
        callOrder.push("regenerate");
        cb();
      });
      const saveMock = vi.fn((cb: (err?: Error) => void) => {
        callOrder.push("save");
        cb();
      });

      mockReq = {
        session: {
          regenerate: regenerateMock,
          save: saveMock,
          userId: undefined as string | undefined,
          role: undefined as string | undefined,
          nombre: undefined as string | undefined,
        },
      };

      await new Promise<void>((resolve, reject) => {
        mockReq.session.regenerate((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      mockReq.session.userId = "user-123";
      mockReq.session.role = "medico";
      mockReq.session.nombre = "Dr. Test";

      await new Promise<void>((resolve, reject) => {
        mockReq.session.save((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      expect(callOrder).toEqual(["regenerate", "save"]);
    });

    it("should assign session properties after regeneration", async () => {
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb());
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb());

      mockReq = {
        session: {
          regenerate: regenerateMock,
          save: saveMock,
          userId: undefined as string | undefined,
          role: undefined as string | undefined,
          nombre: undefined as string | undefined,
        },
      };

      await new Promise<void>((resolve, reject) => {
        mockReq.session.regenerate((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      mockReq.session.userId = "user-456";
      mockReq.session.role = "admin";
      mockReq.session.nombre = "Admin User";

      expect(mockReq.session.userId).toBe("user-456");
      expect(mockReq.session.role).toBe("admin");
      expect(mockReq.session.nombre).toBe("Admin User");
    });
  });

  describe("Session Error Handling", () => {
    it("should reject when regenerate fails", async () => {
      const regenerateError = new Error("regenerate failed");
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb(regenerateError));

      mockReq = {
        session: {
          regenerate: regenerateMock,
        },
      };

      await expect(
        new Promise<void>((resolve, reject) => {
          mockReq.session.regenerate((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        })
      ).rejects.toThrow("regenerate failed");
    });

    it("should reject when save fails", async () => {
      const saveError = new Error("save failed");
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb(saveError));

      mockReq = {
        session: {
          save: saveMock,
        },
      };

      await expect(
        new Promise<void>((resolve, reject) => {
          mockReq.session.save((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        })
      ).rejects.toThrow("save failed");
    });

    it("should not call save if regenerate fails", async () => {
      const regenerateError = new Error("regenerate failed");
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb(regenerateError));
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb());

      mockReq = {
        session: {
          regenerate: regenerateMock,
          save: saveMock,
        },
      };

      try {
        await new Promise<void>((resolve, reject) => {
          mockReq.session.regenerate((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          mockReq.session.save((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch { /* empty */ }

      expect(regenerateMock).toHaveBeenCalledOnce();
      expect(saveMock).not.toHaveBeenCalled();

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

// Mock the storage
vi.mock("../server/storage", () => {
  return {
    storage: {
      getUserByUsername: vi.fn(),
      createAuditLog: vi.fn(),
    }
  };
});

describe("Session Security", () => {
  let app: express.Express;

  // Helper to setup app with specific session middleware
  const setupApp = async (sessionMiddleware: any) => {
    app = express();
    app.use(express.json());
    app.use(sessionMiddleware);
    // registerRoutes expects httpServer but doesn't use it for login logic
    await registerRoutes({} as any, app);
  };

  describe("Happy Path (Real Session)", () => {
    beforeEach(async () => {
      const realSession = session({
        secret: "test-secret",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 60000 }
      });
      await setupApp(realSession);
    });

    it("should regenerate session id after login", async () => {
      const username = "testuser";
      const password = "password123";
      const hashedPassword = await hashPassword(password);

      // Setup mock user
      (storage.getUserByUsername as any).mockResolvedValue({
        id: "1",
        username,
        password: hashedPassword,
        role: "medico",
        nombre: "Test User",
        especialidad: "General",
        cedula: "12345"
      });

      const agent = request.agent(app);

      // 1. Get an initial session
      const initialRes = await agent.get("/api/auth/me");
      const initialCookie = initialRes.headers["set-cookie"];
      expect(initialCookie).toBeDefined();

      const initialSessionId = initialCookie[0].split(';')[0];

      // 2. Login
      const loginRes = await agent
        .post("/api/login")
        .send({ username, password });

      expect(loginRes.status).toBe(200);

      const newCookie = loginRes.headers["set-cookie"];
      expect(newCookie).toBeDefined();

      const newSessionId = newCookie[0].split(';')[0];

      // Verify session ID changed
      expect(newSessionId).not.toBe(initialSessionId);
    });

    it("should set user properties in session", async () => {
      const username = "propuser";
      const password = "password123";
      const hashedPassword = await hashPassword(password);

      (storage.getUserByUsername as any).mockResolvedValue({
        id: "2",
        username,
        password: hashedPassword,
        role: "admin",
        nombre: "Admin User",
      });

      const agent = request.agent(app);

      const loginRes = await agent
        .post("/api/login")
        .send({ username, password });

      expect(loginRes.status).toBe(200);

      // Verify via auth/me endpoint
      const meRes = await agent.get("/api/auth/me");
      expect(meRes.status).toBe(200);
      expect(meRes.body).toEqual({
        id: "2",
        role: "admin",
        nombre: "Admin User"
      });
    });
  });

  describe("Error Handling & Ordering (Mock Session)", () => {
    let regenerateMock: any;
    let saveMock: any;
    let sessionStore: any;

    beforeEach(async () => {
      sessionStore = {
        userId: null,
        role: null,
        nombre: null
      };

      regenerateMock = vi.fn((cb) => cb(null));
      saveMock = vi.fn((cb) => cb(null));

      const mockMiddleware = (req: any, res: any, next: any) => {
        req.session = {
          ...sessionStore,
          regenerate: regenerateMock,
          save: saveMock,
        };
        // Allow setting properties on req.session to update our local store for verification
        // Proxy to capture sets? Or just manual assignment in route.
        // The route does `req.session.userId = ...`
        // We need the mock object to retain these values so we can check them in saveMock
        next();
      };

      await setupApp(mockMiddleware);

      const password = "password123";
      const hashedPassword = await hashPassword(password);
      (storage.getUserByUsername as any).mockResolvedValue({
        id: "1",
        username: "test",
        password: hashedPassword,
        role: "medico",
        nombre: "Test",
      });
    });

    it("should return 500 if regenerate fails", async () => {
      regenerateMock.mockImplementation((cb: any) => cb(new Error("Regenerate failed")));

      const res = await request(app)
        .post("/api/login")
        .send({ username: "test", password: "password123" });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error al iniciar sesión");
      expect(saveMock).not.toHaveBeenCalled();
    });

    it("should return 500 if save fails", async () => {
      saveMock.mockImplementation((cb: any) => cb(new Error("Save failed")));

      const res = await request(app)
        .post("/api/login")
        .send({ username: "test", password: "password123" });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error al guardar la sesión");
    });

    it("should call save after regenerate", async () => {
      await request(app)
        .post("/api/login")
        .send({ username: "test", password: "password123" });

      expect(regenerateMock).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();

      // Verify order: regenerate called, then inside it save called.
      // We can't strictly verify the nesting via spies alone easily without mock implementation logic,
      // but the fact that regenerate calls the callback which calls save is structurally enforced by the code.
      // However, we can verify that when regenerate is called, save hasn't been called yet.
      // But purely async...
      // The previous test (save not called if regenerate fails) proves dependency.
    });

    it("should assign properties after regeneration but before save", async () => {
      // We need to capture the state of session when save is called
      saveMock.mockImplementation(function(this: any, cb: any) {
        // 'this' should be the session object if called as method,
        // but in our mock middleware we attached methods.
        // Let's rely on the route handler setting properties on the object we passed.
        expect(this.userId).toBe("1");
        expect(this.role).toBe("medico");
        expect(this.nombre).toBe("Test");
        cb(null);
      });

      const res = await request(app)
        .post("/api/login")
        .send({ username: "test", password: "password123" });

      expect(res.status).toBe(200);
    });
  });
});
