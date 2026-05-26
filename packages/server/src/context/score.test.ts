import { test } from "node:test";
import assert from "node:assert/strict";
import type { Source } from "../sources/schema.js";
import { tokenize, scoreSource } from "./score.js";

function makeSource(partial: Partial<Source>): Source {
  return {
    id: 1,
    type: "note",
    title: "",
    content: "",
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    addedByName: "Tester",
    addedByEmail: "tester@example.com",
    ...partial,
  };
}

test("tokenize lowercases and splits on non-alphanumeric", () => {
  assert.deepEqual(tokenize("Hello, World! 123"), ["hello", "world", "123"]);
});

test("a term in the title scores higher than the same term in content", () => {
  const titleHit = makeSource({ title: "deployment guide", content: "unrelated" });
  const contentHit = makeSource({ title: "unrelated", content: "deployment guide" });

  const titleScore = scoreSource(titleHit, ["deployment"]);
  const contentScore = scoreSource(contentHit, ["deployment"]);

  assert.ok(titleScore > contentScore, "title match should outrank content match");
});

test("no matching terms yields a score of zero", () => {
  const source = makeSource({ title: "cats", content: "dogs" });
  assert.equal(scoreSource(source, ["spaceship"]), 0);
});

test("multiple query terms accumulate", () => {
  const source = makeSource({ title: "alpha beta", content: "alpha" });
  // "alpha" hits title(3) + content(1) = 4; "beta" hits title(3) = 3; total 7.
  assert.equal(scoreSource(source, ["alpha", "beta"]), 7);
});
