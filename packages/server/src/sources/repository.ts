import type { DB } from "../db.js";
import type { Source, CreateSourceInput, UpdateSourceInput } from "./schema.js";

/** The raw row shape as stored in SQLite (snake_case columns, tags as a JSON string). */
interface SourceRow {
  id: number;
  type: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

/** Convert a database row into the API-facing Source object. */
function rowToSource(row: SourceRow): Source {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Data-access layer for sources. All SQL lives here — routes never touch the
 * database directly. This separation means the rest of the app depends on a clean
 * method API, not on SQL strings, and the storage engine could change without
 * touching the routes.
 */
export class SourceRepository {
  constructor(private readonly db: DB) {}

  list(): Source[] {
    const rows = this.db
      .prepare("SELECT * FROM sources ORDER BY id DESC")
      .all() as SourceRow[];
    return rows.map(rowToSource);
  }

  get(id: number): Source | undefined {
    const row = this.db
      .prepare("SELECT * FROM sources WHERE id = ?")
      .get(id) as SourceRow | undefined;
    return row ? rowToSource(row) : undefined;
  }

  create(input: CreateSourceInput): Source {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(
        `INSERT INTO sources (type, title, content, tags, created_at, updated_at)
         VALUES (@type, @title, @content, @tags, @createdAt, @updatedAt)`,
      )
      .run({
        type: input.type,
        title: input.title,
        content: input.content,
        tags: JSON.stringify(input.tags),
        createdAt: now,
        updatedAt: now,
      });
    // lastInsertRowid is the auto-incremented id of the row we just inserted.
    return this.get(Number(result.lastInsertRowid))!;
  }

  update(id: number, input: UpdateSourceInput): Source | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;

    // Merge: any field not provided in the update keeps its existing value.
    const merged = {
      type: input.type ?? existing.type,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      tags: input.tags ?? existing.tags,
    };
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE sources
         SET type = @type, title = @title, content = @content, tags = @tags, updated_at = @updatedAt
         WHERE id = @id`,
      )
      .run({
        id,
        type: merged.type,
        title: merged.title,
        content: merged.content,
        tags: JSON.stringify(merged.tags),
        updatedAt: now,
      });
    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM sources WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
