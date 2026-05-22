import type { ContextBundle } from "./types.js";

/**
 * A typed client for ContextHub's /context endpoint — this is what the workflow
 * engine would use to fetch assembled context. It knows only the base URL and the
 * contract; it has no dependency on ContextHub's internal code.
 */
export class ContextClient {
  constructor(private readonly baseUrl: string) {}

  async getContext(query: string, limit = 5): Promise<ContextBundle> {
    const url = new URL("/context", this.baseUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Context request failed: ${res.status}`);
    }
    return (await res.json()) as ContextBundle;
  }
}
