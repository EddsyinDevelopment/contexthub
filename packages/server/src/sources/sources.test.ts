import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { openDatabase } from "../db.js";
import { createApp } from "../app.js";

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

test("POST /sources creates a source and returns it with an id", async () => {
  const { base, close } = startServer();
  try {
    const res = await fetch(`${base}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "note",
        title: "Onboarding doc",
        content: "How to set up the dev environment.",
        tags: ["onboarding", "setup"],
        addedByName: "Alice",
        addedByEmail: "alice@example.com"
      }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as { id: number; title: string; tags: string[] };
    assert.ok(Number.isInteger(body.id));
    assert.equal(body.title, "Onboarding doc");
    assert.deepEqual(body.tags, ["onboarding", "setup"]);
  } finally {
    close();
  }
});

test("GET /sources lists created sources", async () => {
  const { base, close } = startServer();
  try {
    await fetch(`${base}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "note", title: "First", content: "one", addedByName: "Alice", addedByEmail: "alice@example.com" }),
    });
    await fetch(`${base}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "doc", title: "Second", content: "two", addedByName: "Bob", addedByEmail: "bob@example.com" }),
    });

    const res = await fetch(`${base}/sources`);
    assert.equal(res.status, 200);
    const list = (await res.json()) as Array<{ title: string }>;
    assert.equal(list.length, 2);
  } finally {
    close();
  }
});

test("GET /sources/:id returns one source, 404 when missing", async () => {
  const { base, close } = startServer();
  try {
    const created = await (
      await fetch(`${base}/sources`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "note", title: "Find me", content: "here", addedByName: "Alice", addedByEmail: "alice@example.com" }),
      })
    ).json() as { id: number };

    const found = await fetch(`${base}/sources/${created.id}`);
    assert.equal(found.status, 200);

    const missing = await fetch(`${base}/sources/99999`);
    assert.equal(missing.status, 404);
  } finally {
    close();
  }
});

test("PUT /sources/:id updates fields", async () => {
  const { base, close } = startServer();
  try {
    const created = await (
      await fetch(`${base}/sources`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "note", title: "Old title", content: "body", addedByName: "Alice", addedByEmail: "alice@example.com" }),
      })
    ).json() as { id: number };

    const res = await fetch(`${base}/sources/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "New title" }),
    });

    assert.equal(res.status, 200);
    const updated = (await res.json()) as { title: string; content: string };
    assert.equal(updated.title, "New title");
    assert.equal(updated.content, "body"); // unchanged field preserved
  } finally {
    close();
  }
});

test("DELETE /sources/:id removes the source", async () => {
  const { base, close } = startServer();
  try {
    const created = await (
      await fetch(`${base}/sources`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "note", title: "Temp", content: "delete me", addedByName: "Alice", addedByEmail: "alice@example.com" }),
      })
    ).json() as { id: number };

    const del = await fetch(`${base}/sources/${created.id}`, { method: "DELETE" });
    assert.equal(del.status, 204);

    const after = await fetch(`${base}/sources/${created.id}`);
    assert.equal(after.status, 404);
  } finally {
    close();
  }
});

test("POST /sources rejects invalid bodies with 400", async () => {
  const { base, close } = startServer();
  try {
    // Missing required fields, and an invalid type.
    const res = await fetch(`${base}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "invalid-type", title: "", content: "", addedByName: "", addedByEmail: "" }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "invalid body");
    
  } finally {
    close();
  }
});

test("POST /sources rejects an invalid email with 400", async () => {
  const { base, close } = startServer();
  try {
    const res = await fetch(`${base}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "note",
        title: "Bad email",
        content: "x",
        addedByName: "Alice",
        addedByEmail: "not-an-email",
      }),
    });
    assert.equal(res.status, 400);
  } finally {
    close();
  }
});