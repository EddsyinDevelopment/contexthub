import express, { type Express } from "express";
import type { DB } from "./db.js";
import { createSourcesRouter } from "./sources/routes.js";
import { createContextRouter } from "./context/routes.js";

/**
 * Build the Express application.
 *
 * The database is passed in (dependency injection) rather than created inside.
 * That's what lets tests hand in an in-memory database while production hands in
 * a file-backed one — same app code, different storage.
 */
export function createApp(db: DB): Express {
  const app = express();

  // Parse JSON request bodies into req.body.
  app.use(express.json());

  // Liveness check — used by CI, load balancers, and the engine to confirm we're up.
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "contexthub",
      time: new Date().toISOString(),
    });
  });

  // Sources CRUD lives under /sources.
  app.use("/sources", createSourcesRouter(db));

  // Context assembly — what the engine calls — lives under /context.
  app.use("/context", createContextRouter(db));

  return app;
}
