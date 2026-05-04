const fs = require("fs/promises");
const path = require("path");
const pool = require("../db/pool");

const migrationsDir = path.resolve(__dirname, "../db/migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrationSet() {
  const { rows } = await pool.query("SELECT filename FROM schema_migrations;");
  return new Set(rows.map((row) => row.filename));
}

async function runMigrations() {
  const files = await fs.readdir(migrationsDir);
  const migrationFiles = files.filter((file) => file.endsWith(".sql")).sort();

  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrationSet();

  for (const file of migrationFiles) {
    if (appliedMigrations.has(file)) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf-8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1);", [file]);
      await pool.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
}

async function main() {
  try {
    await runMigrations();
    console.log("Migrations completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
