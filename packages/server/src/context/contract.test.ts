import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { openDatabase } from "../db.js";
import { createApp } from "../app.js";

/**
 * Contract test: boots the real server and asserts the /context response matches
 * the exact shape the engine depends on. If a future change alters the response
 * structure, this fails in CI — protecting the integration seam between teams.
 */
test("/context response conforms to the engine contract", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const base = `http://localhost:${port}`;

  try {
    await fetch(`${base}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "doc",
        title: "Deploy guide",
        content: "deploy steps",
        tags: ["ops"],
        addedByName: "Alice",
        addedByEmail: "alice@example.com",
      }),
    });

    const res = await fetch(`${base}/context?q=deploy`);
    assert.equal(res.status, 200);
    const bundle = (await res.json()) as Record<string, unknown>;

    // Top-level shape.
    assert.equal(typeof bundle.query, "string");
    assert.ok(Array.isArray(bundle.results));
    assert.equal(typeof bundle.text, "string");
    assert.equal(typeof bundle.assembledAt, "string");

    // Each result carries a numeric score and a fully-formed source.
    const results = bundle.results as Array<Record<string, unknown>>;
    assert.ok(results.length > 0, "expected at least one matching source");
    const first = results[0];
    assert.equal(typeof first.score, "number");

    const source = first.source as Record<string, unknown>;
    for (const field of ["id", "type", "title", "content", "tags", "createdAt", "updatedAt"]) {
      assert.ok(field in source, `source missing required field: ${field}`);
    }
    assert.ok(Array.isArray(source.tags));
  } finally {
    server.close();
    db.close();
  }
});
