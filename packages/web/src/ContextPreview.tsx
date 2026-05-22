import { useState, type FormEvent } from "react";
import type { ContextBundle } from "./types";
import { fetchContext } from "./api";

/**
 * Lets you type a query and see exactly what context bundle the engine would
 * receive — the ranked sources, their scores, and the assembled text blob.
 */
export function ContextPreview() {
  const [query, setQuery] = useState("");
  const [bundle, setBundle] = useState<ContextBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    try {
      setLoading(true);
      setBundle(await fetchContext(query));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Context preview</h2>
      <p className="muted">See what the engine would receive for a query.</p>

      <form onSubmit={handlePreview} className="preview-form">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. deploy"
        />
        <button type="submit">Preview</button>
      </form>

      {error && <div className="error">Error: {error}</div>}

      {loading && <p className="muted">Assembling…</p>}

      {bundle && !loading && (
        <div className="preview-results">
          <h3>
            {bundle.results.length} source{bundle.results.length === 1 ? "" : "s"} matched
          </h3>
          {bundle.results.length > 0 && (
            <ul className="ranked">
              {bundle.results.map((r) => (
                <li key={r.source.id}>
                  <span className="score">{r.score}</span>
                  <span>{r.source.title}</span>
                </li>
              ))}
            </ul>
          )}
          <h3>Assembled context</h3>
          <pre className="assembled">{bundle.text || "(no matching sources)"}</pre>
        </div>
      )}
    </section>
  );
}
