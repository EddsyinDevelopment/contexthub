// The contract ContextHub promises to the engine.
//
// Note these types are defined here *independently* — the engine team models the
// agreed shape on their side, ContextHub models it on theirs, and the server's
// contract test guarantees the real responses match. That's how two teams stay in
// sync across a network boundary without sharing code.

export interface ContextSource {
  id: number;
  type: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  addedByName: string;
  addedByEmail: string;
}

export interface ContextResult {
  source: ContextSource;
  score: number;
}

export interface ContextBundle {
  query: string;
  results: ContextResult[];
  /** All selected sources concatenated, ready to drop into a prompt. */
  text: string;
  assembledAt: string;
}
