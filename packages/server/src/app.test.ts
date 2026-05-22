import { test, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.js";

test("GET /health returns ok", async () => {
  const app = createApp();
  // Listen on port 0 = let the OS pick a free port. Avoids clashes in CI.
  const server = app.listen(0);
  after(() => server.close());

  const { port } = server.address() as AddressInfo;
  const res = await fetch(`http://localhost:${port}/health`);

  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; service: string };
  assert.equal(body.status, "ok");
  assert.equal(body.service, "contexthub");
});
