import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { tenants } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ─── Type augmentation ────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
    }
  }
}

// ─── In-memory cache (slug → tenant) ─────────────────────────────────────────
// Avoids a DB round-trip on every request. TTL of 5 minutes.

interface CachedTenant {
  id: string;
  slug: string;
  activo: boolean;
  expiresAt: number;
}

const tenantCache = new Map<string, CachedTenant>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getTenantBySlug(slug: string): Promise<CachedTenant | null> {
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const [tenant] = await db
    .select({ id: tenants.id, slug: tenants.slug, activo: tenants.activo })
    .from(tenants)
    .where(eq(tenants.slug, slug));

  if (!tenant) return null;

  const entry: CachedTenant = { ...tenant, expiresAt: Date.now() + CACHE_TTL_MS };
  tenantCache.set(slug, entry);
  return entry;
}

export function invalidateTenantCache(slug: string) {
  tenantCache.delete(slug);
}

// ─── Middleware: resolveTenant ─────────────────────────────────────────────────
// Reads slug from (in priority order):
//   1. X-Tenant-Slug header  (future mobile/API clients)
//   2. URL path prefix        /t/:slug/ (EHR)  or  /p/:slug/ (portal)
//   3. Subdomain              viveros.salud-digital.mx
//   4. req.session.tenantId   (fallback for existing /api/ routes)

export async function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Header
  let slug = req.headers["x-tenant-slug"] as string | undefined;

  // 2. Path prefix /t/:slug or /p/:slug
  if (!slug) {
    const match = req.path.match(/^\/(t|p)\/([a-z0-9-]+)/);
    if (match) slug = match[2];
  }

  // 3. Subdomain (e.g. viveros.salud-digital.mx)
  if (!slug) {
    const base = process.env.BASE_DOMAIN || "";
    const hostname = req.hostname;
    if (base && hostname !== base && hostname.endsWith(`.${base}`)) {
      slug = hostname.replace(`.${base}`, "").split(".")[0];
    }
  }

  // 4. Session fallback — preserves existing /api/ route behavior in Phase 1
  if (!slug && req.session?.tenantId) {
    req.tenantId = req.session.tenantId;
    return next();
  }

  if (!slug) return next(); // public routes without tenant context (landing page, etc.)

  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    return res.status(404).json({ error: "Tenant no encontrado" });
  }
  if (!tenant.activo) {
    return res.status(403).json({ error: "Esta cuenta está suspendida" });
  }

  req.tenantId = tenant.id;
  req.tenantSlug = tenant.slug;
  next();
}

// ─── Middleware: requireTenantMatch ───────────────────────────────────────────
// Prevents cross-tenant access: session.tenantId must match URL-derived tenantId.
// Applied to authenticated EHR routes that use /t/:slug/ path prefix.

export function requireTenantMatch(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantId) {
    return res.status(400).json({ error: "Tenant no identificado" });
  }
  if (req.session?.tenantId && req.session.tenantId !== req.tenantId) {
    return res.status(403).json({ error: "Acceso cross-tenant denegado" });
  }
  next();
}

// ─── withTenantContext ────────────────────────────────────────────────────────
// Wraps a database operation in a transaction and sets the PostgreSQL session
// variable `app.current_tenant_id` for Row Level Security.
//
// The SET LOCAL is transaction-scoped, making it safe in a connection pool:
// when the transaction ends, the variable is cleared automatically.
//
// Usage:
//   const patients = await withTenantContext(tenantId, (tx) =>
//     tx.select().from(patients).where(eq(patients.tenantId, tenantId))
//   );

export async function withTenantContext<T>(
  tenantId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
    );
    return fn(tx as unknown as typeof db);
  });
}
