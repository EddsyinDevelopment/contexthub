import type { Source, CreateSourceInput, ContextBundle } from "./types";

// All API calls use relative paths. In dev, Vite's proxy forwards them to the
// backend on port 3000; in production they'd hit whatever host serves the app.

export interface SourceFilters {
  dateFrom?: string;
  dateTo?: string;
}

export async function listSources(filters: SourceFilters = {}): Promise<Source[]> {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString();
  const res = await fetch(qs ? `/sources?${qs}` : "/sources");
  if (!res.ok) throw new Error(`Failed to list sources (${res.status})`);
  return res.json() as Promise<Source[]>;
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  const res = await fetch("/sources", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create source (${res.status})`);
  return res.json() as Promise<Source>;
}

export async function deleteSource(id: number): Promise<void> {
  const res = await fetch(`/sources/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete source (${res.status})`);
}

export async function fetchContext(
  query: string,
  filters: SourceFilters = {},
  limit = 5,
): Promise<ContextBundle> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const res = await fetch(`/context?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch context (${res.status})`);
  return res.json() as Promise<ContextBundle>;
}
