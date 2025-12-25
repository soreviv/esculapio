import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 12;

async function migratePasswords() {
  console.log("Starting password migration...");
  console.log("This script will hash all plaintext passwords in the database.\n");

  try {
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to check.\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      const isAlreadyHashed = user.password.startsWith("$2a$") || 
                               user.password.startsWith("$2b$") ||
                               user.password.startsWith("$2y$");

      if (isAlreadyHashed) {
        console.log(`User "${user.username}" - Password already hashed, skipping.`);
        skippedCount++;
        continue;
      }

      console.log(`User "${user.username}" - Hashing plaintext password...`);
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      console.log(`User "${user.username}" - Password hashed successfully.`);
      migratedCount++;
    }

    console.log("\n========================================");
    console.log("Password migration completed!");
    console.log(`  Migrated: ${migratedCount} users`);
    console.log(`  Skipped (already hashed): ${skippedCount} users`);
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error during password migration:", error);
    process.exit(1);
  }
}

migratePasswords();
