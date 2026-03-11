import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import "./auth";
import fhirRouter from "./fhir-routes";
import { isSensitivePath, redactSensitiveData } from "./logging-utils";

// Structured logging with Pino
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  } : undefined,
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization", "res.headers['set-cookie']"],
    remove: true,
  },
});

export { logger };

const app = express();
const httpServer = createServer(app);

// Trust proxy for rate limiting to work correctly behind reverse proxies (Nginx)
app.set("trust proxy", 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: process.env.NODE_ENV === "production"
        ? ["'self'", "'unsafe-inline'"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Demasiadas solicitudes, intente de nuevo más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de inicio de sesión, intente de nuevo en 15 minutos" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use("/api/", generalLimiter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

// Structured HTTP request logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url?.startsWith("/assets") || req.url?.startsWith("/@"),
  },
  redact: ["req.headers.cookie", "req.headers.authorization"],
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session Configuration
const PgSession = connectPgSimple(session);
let sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is required in production");
  } else {
    sessionSecret = crypto.randomBytes(64).toString("hex");
    process.stderr.write("WARN: No SESSION_SECRET provided in development. Generated a temporary random secret.\n");
    logger.warn("No SESSION_SECRET provided in development. Generated a temporary random secret.");
  }
}

app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  })
);

export function log(message: string, source = "express") {
  logger.info({ source }, message);
}

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Salud Digital API Documentation",
}));

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// HL7 FHIR R4 API Routes
app.use("/fhir", fhirRouter);

// Response Logging & Redaction Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any = undefined;

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
        if (process.env.NODE_ENV === "production" && isSensitivePath(path)) {
          const count = Array.isArray(capturedJsonResponse) ? capturedJsonResponse.length : 1;
          logLine += ` :: [${count} record(s)]`;
        } else {
          logLine += ` :: ${JSON.stringify(redactSensitiveData(capturedJsonResponse))}`;
        }
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    log("Registering routes...");
    await registerRoutes(httpServer, app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      logger.error({ err }, "Unhandled application error");
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      log("Setting up static file serving for production...");
      serveStatic(app);
    } else {
      log("Setting up Vite development server...");
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.on("error", (err: NodeJS.ErrnoException) => {
      logger.fatal({ err }, "HTTP server failed to start");
      process.exit(1);
    });
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`Server listening on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
})();
