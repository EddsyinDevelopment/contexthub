import { Router } from "express";
import type { DB } from "../db.js";
import { SourceRepository } from "./repository.js";
import { createSourceSchema, updateSourceSchema } from "./schema.js";

/**
 * Build the /sources router. Takes the database so the repository can be wired up;
 * this keeps the routes free of any global state and easy to test.
 */
export function createSourcesRouter(db: DB): Router {
  const router = Router();
  const repo = new SourceRepository(db);

  // List all sources.
  router.get("/", (_req, res) => {
    res.json(repo.list());
  });

  // Fetch a single source by id.
  router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be an integer" });
      return;
    }
    const source = repo.get(id);
    if (!source) {
      res.status(404).json({ error: "source not found" });
      return;
    }
    res.json(source);
  });

  // Create a source. Body is validated by zod before it touches the database.
  router.post("/", (req, res) => {
    const parsed = createSourceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", details: parsed.error.flatten() });
      return;
    }
    const created = repo.create(parsed.data);
    res.status(201).json(created);
  });

  // Update a source (partial update — send only the fields you want to change).
  router.put("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be an integer" });
      return;
    }
    const parsed = updateSourceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", details: parsed.error.flatten() });
      return;
    }
    const updated = repo.update(id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: "source not found" });
      return;
    }
    res.json(updated);
  });

  // Delete a source.
  router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be an integer" });
      return;
    }
    const deleted = repo.delete(id);
    if (!deleted) {
      res.status(404).json({ error: "source not found" });
      return;
    }
    res.status(204).end();
  });

  return router;
}
