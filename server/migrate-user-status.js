import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import initSqlJs from "sql.js";

const DB_PATH = join(process.cwd(), "healthcare.db");

async function migrateUserStatus() {
  try {
    console.log("🔄 Starting user status migration...");

    // Initialize sql.js
    const SQL = await initSqlJs();

    if (!existsSync(DB_PATH)) {
      console.log("❌ Database file not found");
      return;
    }

    // Load existing database
    const data = readFileSync(DB_PATH);
    const db = new SQL.Database(data);

    // Check if status column already exists
    const tableInfo = db.exec("PRAGMA table_info(users)");
    const hasStatusColumn = tableInfo[0]?.values.some(
      (row) => row[1] === "status",
    );

    if (hasStatusColumn) {
      console.log("✅ Status column already exists");
      db.close();
      return;
    }

    console.log("📝 Adding status column to users table...");

    // Add status column with default value 'active'
    db.run(
      "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended'))",
    );

    // Update existing users to have 'active' status
    db.run("UPDATE users SET status = 'active' WHERE status IS NULL");

    // Save the updated database
    const updatedData = db.export();
    writeFileSync(DB_PATH, updatedData);

    console.log("✅ User status migration completed successfully");

    db.close();
  } catch (error) {
    console.error("❌ Error during migration:", error);
  }
}

// Run migration
migrateUserStatus();
