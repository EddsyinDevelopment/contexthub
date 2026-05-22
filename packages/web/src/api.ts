import type { Source, CreateSourceInput } from "./types";

// All API calls use relative paths. In dev, Vite's proxy forwards them to the
// backend on port 3000; in production they'd hit whatever host serves the app.

export async function listSources(): Promise<Source[]> {
  const res = await fetch("/sources");
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
