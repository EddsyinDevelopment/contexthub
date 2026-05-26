import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ContextBundle } from "./types";
import { fetchContext } from "./api";

export function ContextPreview() {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [bundle, setBundle] = useState<ContextBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreview = useCallback(async (q: string, df: string, dt: string, ab: string) => {
    setLoading(true);
    try {
      setBundle(
        await fetchContext(q, {
          dateFrom: df || undefined,
          dateTo: dt || undefined,
          addedBy: ab || undefined,
        }),
      );
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-trigger when dates change so picking a date immediately filters results.
  useEffect(() => {
    if (dateFrom || dateTo) void runPreview(query, dateFrom, dateTo, addedBy);
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePreview(event: FormEvent) {
    event.preventDefault();
    if (!query && !dateFrom && !dateTo && !addedBy) return;
    await runPreview(query, dateFrom, dateTo, addedBy);
  }

  function handleClearDates() {
    setDateFrom("");
    setDateTo("");
  }

  const hasFilters = query || dateFrom || dateTo || addedBy;

  return (
    <section className="card">
      <h2>Context preview</h2>
      <p className="muted">Filter by date, query, or both. Dates apply without a query.</p>

      <form onSubmit={handlePreview}>
        <div className="preview-form">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. deploy (optional)"
          />
          <input
            value={addedBy}
            onChange={(e) => setAddedBy(e.target.value)}
            placeholder="Added by name or email"
          />
          <button type="submit" disabled={!hasFilters}>
            Preview
          </button>
        </div>

        <div className="date-filter">
          <label>
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
          {(dateFrom || dateTo) && (
            <button type="button" className="clear-btn" onClick={handleClearDates}>
              Clear dates
            </button>
          )}
        </div>
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
                  {r.score > 0 && <span className="score">{r.score}</span>}
                  <span>{r.source.title}</span>
                  <span className="meta" style={{ marginLeft: "auto", fontSize: "0.72rem" }}>
                    {new Date(r.source.createdAt).toLocaleDateString()}
                  </span>
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
