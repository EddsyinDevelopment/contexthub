// Mirrors the Source shape returned by the API. In a larger setup this type could be
// generated from the server's zod schemas or a shared package, so the two never drift.
export interface Source {
  id: number;
  type: "note" | "doc" | "snippet";
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  addedByName: string;
  addedByEmail: string;
}

export interface CreateSourceInput {
  type: string;
  title: string;
  content: string;
  tags: string[];
  addedByName: string;
  addedByEmail: string;
}

export interface ContextResult {
  source: Source;
  score: number;
}

export interface ContextBundle {
  query: string;
  results: ContextResult[];
  text: string;
  assembledAt: string;
}
