import { test, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";

test("GET /health returns ok", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  const server = app.listen(0);
  after(() => {
    server.close();
    db.close();
  });

  const { port } = server.address() as AddressInfo;
  const res = await fetch(`http://localhost:${port}/health`);

  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; service: string };
  assert.equal(body.status, "ok");
  assert.equal(body.service, "contexthub");
});
