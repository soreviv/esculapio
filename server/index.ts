import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import "./auth";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const PgSession = connectPgSimple(session);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "medirecord-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const SENSITIVE_PATHS = [
  "/api/patients",
  "/api/notes",
  "/api/vitals",
  "/api/prescriptions",
  "/api/lab-orders",
  "/api/consents",
  "/api/appointments",
  "/api/audit-logs",
];

function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some(p => path.startsWith(p));
}

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /curp/i,
  /telefono/i,
  /direccion/i,
  /email/i,
  /diagnostico/i,
  /plan$/i,
  /subjetivo/i,
  /objetivo/i,
  /analisis/i,
  /medicamento/i,
  /indicaciones/i,
  /estudios/i,
  /observaciones/i,
  /cedula/i,
  /nombre/i,
  /apellido/i,
  /fechanacimiento/i,
  /sexo/i,
  /tiposangre/i,
  /alergias/i,
  /antecedentes/i,
  /contactoemergencia/i,
  /detalles/i,
];

function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

function redactSensitiveData(data: any, depth: number = 0): any {
  if (depth > 10) return "[MAX_DEPTH]";
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, depth + 1));
  }
  
  const redacted: Record<string, any> = {};
  
  for (const key of Object.keys(data)) {
    if (isSensitiveField(key)) {
      redacted[key] = "[REDACTED]";
    } else if (typeof data[key] === "object" && data[key] !== null) {
      redacted[key] = redactSensitiveData(data[key], depth + 1);
    } else {
      redacted[key] = data[key];
    }
  }
  
  return redacted;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (capturedJsonResponse) {
        if (process.env.NODE_ENV === "production") {
          if (isSensitivePath(path)) {
            const count = Array.isArray(capturedJsonResponse) 
              ? capturedJsonResponse.length 
              : 1;
            logLine += ` :: [${count} record(s)]`;
          } else {
            logLine += ` :: ${JSON.stringify(redactSensitiveData(capturedJsonResponse))}`;
          }
        } else {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
