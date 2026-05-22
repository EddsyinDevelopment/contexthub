import { Router } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { SourceRepository } from "../sources/repository.js";
import { assembleContext } from "./assemble.js";

/** Query-param contract for GET /context. Note z.coerce — query params arrive as strings. */
const contextQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

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
    const { q, limit } = parsed.data;

    // Pull all sources, then rank in memory. Fine for now; if the table grows large
    // this is the seam where you'd push scoring into SQL or a search index instead.
    const sources = repo.list();
    const bundle = assembleContext(sources, q, limit);

    res.json(bundle);
  });

  return router;
}
