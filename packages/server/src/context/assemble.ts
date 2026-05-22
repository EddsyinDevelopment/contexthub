import type { Source } from "../sources/schema.js";
import { scoreSource, tokenize } from "./score.js";

/** One ranked source in the result set. */
export interface ContextResult {
  source: Source;
  score: number;
}

/** What the engine receives: ranked results plus a ready-to-use assembled text blob. */
export interface ContextBundle {
  query: string;
  results: ContextResult[];
  /** All selected sources concatenated into one block, ready to drop into a prompt. */
  text: string;
  assembledAt: string;
}

/**
 * The core context-assembly logic. Given all sources and a query:
 *   1. score each source against the query terms,
 *   2. drop the ones that don't match at all,
 *   3. sort by descending relevance,
 *   4. keep the top `limit`,
 *   5. stitch the survivors into a single text block.
 *
 * Pure function over its inputs — no database access here, which keeps it trivial to test.
 */
export function assembleContext(sources: Source[], query: string, limit = 5): ContextBundle {
  const queryTerms = tokenize(query);

  const results = sources
    .map((source) => ({ source, score: scoreSource(source, queryTerms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const text = results
    .map((r) => `## ${r.source.title}\n${r.source.content}`)
    .join("\n\n");

  return {
    query,
    results,
    text,
    assembledAt: new Date().toISOString(),
  };
}
