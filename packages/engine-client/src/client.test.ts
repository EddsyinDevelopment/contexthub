import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { ContextClient } from "./client.js";

afterEach(() => mock.restoreAll());

test("getContext calls /context with q and limit, returns the parsed bundle", async () => {
  const fakeBundle = { query: "deploy", results: [], text: "", assembledAt: "now" };

  const fetchMock = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/context");
    assert.equal(url.searchParams.get("q"), "deploy");
    assert.equal(url.searchParams.get("limit"), "3");
    return new Response(JSON.stringify(fakeBundle), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  const client = new ContextClient("http://example.test");
  const bundle = await client.getContext("deploy", 3);

  assert.equal(bundle.query, "deploy");
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("getContext throws on a non-ok response", async () => {
  mock.method(globalThis, "fetch", async () => new Response("bad", { status: 400 }));

  const client = new ContextClient("http://example.test");
  await assert.rejects(() => client.getContext("x"), /failed: 400/);
});
