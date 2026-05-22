import process from "node:process";
import { ContextClient } from "./client.js";

// A tiny CLI standing in for the engine: given a query, it fetches context from
// ContextHub and prints what it would feed into a workflow/prompt.
//
//   npm run dev -w @contexthub/engine-client -- "deploy"
//
// Point it at a different host with CONTEXTHUB_URL.

const baseUrl = process.env.CONTEXTHUB_URL ?? "http://localhost:3000";
const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error('Usage: engine-client "<query>"');
  process.exit(1);
}

const client = new ContextClient(baseUrl);
const bundle = await client.getContext(query);

console.log(`\n=== Context for "${bundle.query}" (${bundle.results.length} source(s)) ===\n`);
for (const result of bundle.results) {
  console.log(`  [score ${result.score}] ${result.source.title}`);
}
console.log(`\n--- Assembled context the engine would use ---\n`);
console.log(bundle.text || "(no matching sources)");
