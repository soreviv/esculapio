
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

describe("Session Fixation Vulnerability", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    // Use saveUninitialized: true to ensure we can get a session cookie before login
    app.use(session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge: 60000 }
    }));

    // Register routes
    // We need to pass a mock httpServer, but registerRoutes only uses it for swagger/vite which we don't need here?
    // Actually registerRoutes takes (httpServer, app).
    // Let's pass a dummy object for httpServer.
    await registerRoutes({} as any, app);
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
    // Even if 401, saveUninitialized: true should set a cookie
    const initialCookie = initialRes.headers["set-cookie"];
    expect(initialCookie).toBeDefined();

    // Extract the session ID part roughly to compare
    const initialSessionId = initialCookie[0].split(';')[0];

    // 2. Login with the existing session
    // Supertest agent automatically persists cookies, so the next request will send the cookie obtained above.
    const loginRes = await agent
      .post("/api/login")
      .send({ username, password });

    expect(loginRes.status).toBe(200);

    const newCookie = loginRes.headers["set-cookie"];

    // Verification logic:
    // If the session IS regenerated, we expect a new Set-Cookie header with a different ID.
    // If the session IS NOT regenerated (vulnerable), express-session typically does not send a Set-Cookie header
    // if the session ID hasn't changed and the session wasn't modified in a way that requires resaving (depends on resave/rolling).
    // Or if it does send it, it will be the same ID.

    if (newCookie) {
        const newSessionId = newCookie[0].split(';')[0];
        // If vulnerability exists, these might be equal (if set-cookie is sent)
        // We want to ASSERT that they are DIFFERENT for the fix.
        // For reproduction of the failure, we check current behavior.

        // In the current vulnerable code:
        // verifyPassword -> true
        // req.session.userId = ...
        // Response sent.

        // Since we modified the session (added userId), and we are using default memory store (compatible with express-session defaults in test),
        // it might set the cookie again.

        // If the code is VULNERABLE, the ID should be the same.
        // If FIXED, the ID should be different.

        // Let's print them to be sure what happens.
        console.log("Initial Session ID:", initialSessionId);
        console.log("New Session ID:", newSessionId);

        // Failing test expectation (Testing for the FIX):
        expect(newSessionId).not.toBe(initialSessionId);
    } else {
        // If no new cookie is sent, it implies the session ID didn't change (vulnerable behavior usually,
        // unless rolling: true which isn't default).
        // So if newCookie is undefined, it's definitely not regenerated (or at least the client isn't told about it).
        // So we fail the test because we expect regeneration.
        throw new Error("Session was not regenerated (no Set-Cookie header received on login)");
    }
  });
});
