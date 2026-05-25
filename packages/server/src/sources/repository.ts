import type { DB } from "../db.js";
import type { Source, CreateSourceInput, UpdateSourceInput, ListFilters } from "./schema.js";

/** The raw row shape as stored in SQLite (snake_case columns, tags as a JSON string). */
interface SourceRow {
  id: number;
  type: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
  added_by_name: string;
  added_by_email: string;
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
    addedByName: row.added_by_name,
    addedByEmail: row.added_by_email,
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

  list(filters: ListFilters = {}): Source[] {
    const conditions: string[] = [];
    const params: Record<string, string> = {};

    if (filters.dateFrom) {
      conditions.push("created_at >= @dateFrom");
      params.dateFrom = `${filters.dateFrom}T00:00:00.000Z`;
    }
    if (filters.dateTo) {
      conditions.push("created_at <= @dateTo");
      params.dateTo = `${filters.dateTo}T23:59:59.999Z`;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = this.db
      .prepare(`SELECT * FROM sources ${where} ORDER BY id DESC`)
      .all(params) as SourceRow[];
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
        `INSERT INTO sources (type, title, content, tags, created_at, updated_at, added_by_name, added_by_email)
         VALUES (@type, @title, @content, @tags, @createdAt, @updatedAt, @addedByName, @addedByEmail)`,
      )
      .run({
        type: input.type,
        title: input.title,
        content: input.content,
        tags: JSON.stringify(input.tags),
        createdAt: now,
        updatedAt: now,
        addedByName: input.addedByName,
        addedByEmail: input.addedByEmail,
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
      addedByName: input.addedByName ?? existing.addedByName,
      addedByEmail: input.addedByEmail ?? existing.addedByEmail,
    };
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE sources
         SET type = @type, title = @title, content = @content, tags = @tags, updated_at = @updatedAt, added_by_name = @addedByName, added_by_email = @addedByEmail
         WHERE id = @id`,
      )
      .run({
        id,
        type: merged.type,
        title: merged.title,
        content: merged.content,
        tags: JSON.stringify(merged.tags),
        updatedAt: now,
        addedByName: merged.addedByName,
        addedByEmail: merged.addedByEmail,
      });
    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM sources WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
