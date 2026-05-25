import { z } from "zod";

/** The kinds of source ContextHub can store. Extend this as new origins are added. */
export const sourceTypeSchema = z.enum(["note", "doc", "snippet"]);

/** Validation for creating a source — this is the API contract for POST /sources. */
export const createSourceSchema = z.object({
  type: sourceTypeSchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  addedByName: z.string().min(1),
  addedByEmail: z.email(),
});

/** Updating allows any subset of the create fields (PATCH-like semantics on PUT). */
export const updateSourceSchema = createSourceSchema.partial();

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;

/** Query params for filtering the sources list. Dates are YYYY-MM-DD strings. */
export const listFiltersSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type ListFilters = z.infer<typeof listFiltersSchema>;

/** The shape we return to clients. `tags` is a real array here (stored as JSON text in SQLite). */
export interface Source {
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
