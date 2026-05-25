import { Router } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { SourceRepository } from "../sources/repository.js";
import { listFiltersSchema } from "../sources/schema.js";
import { assembleContext } from "./assemble.js";
import type { ContextBundle } from "./assemble.js";

/** Query-param contract for GET /context. `q` is optional — omit it to browse by date only. */
const contextQuerySchema = z
  .object({
    q: z.string().default(""),
    limit: z.coerce.number().int().min(1).max(50).default(5),
  })
  .merge(listFiltersSchema);

/**
 * Build the /context router — the endpoint the workflow engine calls to fetch
 * relevant context for a query.
 */
export function createContextRouter(db: DB): Router {
  const router = Router();
  const repo = new SourceRepository(db);

  router.get("/", (req, res) => {
    const parsed = contextQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid query", details: parsed.error.flatten() });
      return;
    }
    const { q, limit, dateFrom, dateTo } = parsed.data;

    const sources = repo.list({ dateFrom, dateTo });

    let bundle: ContextBundle;
    if (q) {
      // Keyword mode: score and rank against the query, apply limit.
      bundle = assembleContext(sources, q, limit);
    } else {
      // Browse mode: no query — return all matching sources unranked.
      const results = sources.map((source) => ({ source, score: 0 }));
      bundle = {
        query: "",
        results,
        text: results.map((r) => `## ${r.source.title}\n${r.source.content}`).join("\n\n"),
        assembledAt: new Date().toISOString(),
      };
    }

    res.json(bundle);
  });

  return router;
}
