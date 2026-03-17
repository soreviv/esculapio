import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("Session Config Environment Validation", () => {
  it("should fail in production if SESSION_SECRET is missing", () => {
    try {
      // Provide ENCRYPTION_KEY so we reach the SESSION_SECRET check
      execSync(
        "NODE_ENV=production DATABASE_URL=postgres://localhost:5432/db ENCRYPTION_KEY=test-encryption-key-32-chars-prod SESSION_SECRET= npx tsx server/index.ts",
        { stdio: "pipe", timeout: 15000 }
      );
      throw new Error("Should have failed");
    } catch (error: any) {
      const output = error.stderr?.toString() || "";
      expect(output).toContain("SESSION_SECRET environment variable is required in production");
    }
  });

  it("should show warning in development if SESSION_SECRET is missing", { timeout: 20000 }, () => {
      try {
        execSync("NODE_ENV=development DATABASE_URL=postgres://localhost:5432/db SESSION_SECRET= PORT=19999 npx tsx server/index.ts", {
          stdio: "pipe",
          timeout: 12000
        });
      } catch (error: any) {
        // It will fail due to timeout or port conflict; capture combined output
        const stdout = error.stdout?.toString() || "";
        const stderr = error.stderr?.toString() || "";
        const output = stdout + stderr;
        expect(output).toContain("No SESSION_SECRET provided in development");
      }
  });
});
