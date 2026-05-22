import type { Source } from "../sources/schema.js";

/** Split text into lowercase alphanumeric terms. The basis of keyword matching. */
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/**
 * How many tokens in `terms` match `queryTerm`. A token matches if it *starts with*
 * the query term, so "deploy" matches both "deploy" and "deployment". This gives
 * basic prefix matching without pulling in a full stemming library.
 */
function countMatches(terms: string[], queryTerm: string): number {
  let n = 0;
  for (const t of terms) if (t.startsWith(queryTerm)) n += 1;
  return n;
}

/** Field weights — a hit in the title matters more than one buried in the content. */
const TITLE_WEIGHT = 3;
const TAG_WEIGHT = 2;
const CONTENT_WEIGHT = 1;

/**
 * Score how relevant a source is to a set of query terms.
 *
 * Pure function: same inputs always give the same number, no I/O. That's what makes
 * relevance ranking easy to test and easy to swap out later (e.g. for embeddings).
 */
export function scoreSource(source: Source, queryTerms: string[]): number {
  const titleTerms = tokenize(source.title);
  const tagTerms = source.tags.flatMap(tokenize);
  const contentTerms = tokenize(source.content);

  let score = 0;
  for (const term of queryTerms) {
    score += countMatches(titleTerms, term) * TITLE_WEIGHT;
    score += countMatches(tagTerms, term) * TAG_WEIGHT;
    score += countMatches(contentTerms, term) * CONTENT_WEIGHT;
  }
  return score;
}
