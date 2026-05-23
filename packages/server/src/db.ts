import process from "node:process";
import Database from "better-sqlite3";

/** The concrete database instance type, re-exported so other modules don't import better-sqlite3 directly. */
export type DB = Database.Database;

/**
 * Open (or create) the SQLite database and ensure the schema exists.
 *
 * Pass ":memory:" for an ephemeral in-memory database — that's what the tests use,
 * so each test run starts from a clean, isolated database with no file on disk.
 */
export function openDatabase(path: string = process.env.DB_PATH ?? "contexthub.sqlite"): DB {
  const db = new Database(path);
  // WAL mode improves concurrent read/write performance; a sensible default.
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

/**
 * Create tables if they don't already exist. This is a minimal "migration" —
 * real projects use versioned migration files, but CREATE TABLE IF NOT EXISTS is
 * enough to get the schema in place for now.
 */
function migrate(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL,
      tags       TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      added_by_name TEXT NOT NULL,
      added_by_email TEXT NOT NULL
    );
  `);
}
