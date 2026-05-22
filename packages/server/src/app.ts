import express, { type Express } from "express";

/**
 * Build the Express application.
 *
 * Note we *create* the app here but do not call `listen`. Separating "build the app"
 * from "bind it to a port" is what makes the server testable: tests can construct a
 * fresh app and make requests against it without occupying a fixed port.
 */
export function createApp(): Express {
  const app = express();

  // Parse JSON request bodies into req.body.
  app.use(express.json());

  // Liveness check — the simplest possible endpoint. Used by CI, load balancers,
  // and the engine to confirm the service is up.
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "contexthub",
      time: new Date().toISOString(),
    });
  });

  return app;
}
