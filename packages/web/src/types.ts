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
}

export interface CreateSourceInput {
  type: string;
  title: string;
  content: string;
  tags: string[];
}
