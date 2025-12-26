import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pooling configuration for production
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pool size configuration
  max: parseInt(process.env.DB_POOL_MAX || "20"), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || "2"),  // Minimum idle connections
  // Connection timeouts
  idleTimeoutMillis: 30000,        // Close idle connections after 30s
  connectionTimeoutMillis: 10000,  // Fail connection attempt after 10s
  // Keep connections alive
  allowExitOnIdle: false,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export const db = drizzle(pool, { schema });
