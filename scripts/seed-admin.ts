import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as readline from "readline";

const SALT_ROUNDS = 12;

function prompt(question: string, hidden: boolean = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function seedAdmin() {
  console.log("========================================");
  console.log("   MediRecord - Admin User Setup");
  console.log("========================================\n");

  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.log("Error: ADMIN_PASSWORD environment variable is required.");
    console.log("\nUsage:");
    console.log("  ADMIN_PASSWORD=your_secure_password npx tsx scripts/seed-admin.ts");
    console.log("\nThe password should be at least 8 characters and include:");
    console.log("  - Uppercase and lowercase letters");
    console.log("  - Numbers");
    console.log("  - Special characters");
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.log("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  try {
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists. Updating password...");
      const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "admin"));
      console.log("Admin password updated successfully.");
    } else {
      console.log("Creating new admin user...");
      const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
        nombre: "Administrador del Sistema",
        especialidad: null,
        cedula: null,
      });
      console.log("Admin user created successfully.");
    }

    console.log("\n========================================");
    console.log("Admin user ready:");
    console.log("  Username: admin");
    console.log("  Password: (as provided in ADMIN_PASSWORD)");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
