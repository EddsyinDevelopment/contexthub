import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { openDatabase } from "../db.js";
import { createApp } from "../app.js";
import type { ContextBundle } from "./assemble.js";

/** Boot a fresh app on a random port with an isolated in-memory database. */
function startServer() {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const base = `http://localhost:${port}`;
  const close = () => {
    server.close();
    db.close();
  };
  return { base, close };
}

/** Helper: create a source via the API. */
async function seed(base: string, body: Record<string, unknown>) {
  await fetch(`${base}/sources`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ addedByName: "Alice", addedByEmail: "alice@example.com", ...body }),
  });
}

test("GET /context returns the most relevant sources, ranked", async () => {
  const { base, close } = startServer();
  try {
    await seed(base, { type: "doc", title: "Deployment runbook", content: "How to deploy the service." });
    await seed(base, { type: "note", title: "Lunch ideas", content: "tacos and ramen" });
    await seed(base, { type: "snippet", title: "Misc", content: "deploy deploy deploy" });

    const res = await fetch(`${base}/context?q=deploy`);
    assert.equal(res.status, 200);

    const bundle = (await res.json()) as ContextBundle;
    assert.equal(bundle.query, "deploy");
    // The lunch note shouldn't match at all.
    assert.equal(bundle.results.length, 2);
    // Title match ("Deployment runbook") should outrank the content-only matches.
    assert.equal(bundle.results[0].source.title, "Deployment runbook");
    // The assembled text should include the top result's content.
    assert.ok(bundle.text.includes("How to deploy the service."));
  } finally {
    close();
  }
});

test("GET /context respects the limit parameter", async () => {
  const { base, close } = startServer();
  try {
    await seed(base, { type: "note", title: "alpha one", content: "alpha" });
    await seed(base, { type: "note", title: "alpha two", content: "alpha" });
    await seed(base, { type: "note", title: "alpha three", content: "alpha" });

    const res = await fetch(`${base}/context?q=alpha&limit=2`);
    const bundle = (await res.json()) as ContextBundle;
    assert.equal(bundle.results.length, 2);
  } finally {
    close();
  }
});

test("GET /context requires a non-empty q", async () => {
  const { base, close } = startServer();
  try {
    const res = await fetch(`${base}/context`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "invalid query");
  } finally {
    close();
  }
});
