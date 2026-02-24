import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("Session Config Environment Validation", () => {
  it("should fail in production if SESSION_SECRET is missing", () => {
    try {
      // We use a dummy DATABASE_URL to get past the first check
      execSync("NODE_ENV=production DATABASE_URL=postgres://localhost:5432/db SESSION_SECRET= npx tsx server/index.ts", {
        stdio: "pipe",
        timeout: 15000
      });
      throw new Error("Should have failed");
    } catch (error: any) {
      const output = error.stderr?.toString() || "";
      expect(output).toContain("SESSION_SECRET environment variable is required in production");
    }
  });

  it("should show warning in development if SESSION_SECRET is missing", () => {
      try {
        execSync("NODE_ENV=development DATABASE_URL=postgres://localhost:5432/db SESSION_SECRET= npx tsx server/index.ts", {
          stdio: "pipe",
          timeout: 15000
        });
      } catch (error: any) {
        // It will likely fail later due to database connection, but we want to see the warning
        const output = error.stdout?.toString() || "";
        expect(output).toContain("Using a temporary secret for development");
      }
  });
});
