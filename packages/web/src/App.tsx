import { useEffect, useState, type FormEvent } from "react";
import type { Source } from "./types";
import { listSources, createSource, deleteSource, fetchContext } from "./api";

interface SearchFilters {
  query: string;
  addedBy: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: SearchFilters = { query: "", addedBy: "", dateFrom: "", dateTo: "" };

export function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [scores, setScores] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search inputs (live, before submit)
  const [inputQuery, setInputQuery] = useState("");
  const [inputAddedBy, setInputAddedBy] = useState("");
  const [inputDateFrom, setInputDateFrom] = useState("");
  const [inputDateTo, setInputDateTo] = useState("");

  // Active filters (committed on submit)
  const [activeFilters, setActiveFilters] = useState<SearchFilters>(emptyFilters);

  // Add-source form fields
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [addedByName, setAddedByName] = useState("");
  const [addedByEmail, setAddedByEmail] = useState("");

  async function loadSources(filters: SearchFilters = activeFilters) {
    setLoading(true);
    setError(null);
    try {
      const f = {
        addedBy: filters.addedBy || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      };
      if (filters.query) {
        const bundle = await fetchContext(filters.query, f, 50);
        setSources(bundle.results.map((r) => r.source));
        setScores(new Map(bundle.results.map((r) => [r.source.id, r.score])));
      } else {
        const list = await listSources(f);
        setSources(list);
        setScores(new Map());
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSources(emptyFilters);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createSource({
        type,
        title,
        content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        addedByName,
        addedByEmail,
      });
      setTitle(""); setContent(""); setTags(""); setAddedByName(""); setAddedByEmail("");
      await loadSources();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSource(id);
      await loadSources();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const newFilters: SearchFilters = {
      query: inputQuery,
      addedBy: inputAddedBy,
      dateFrom: inputDateFrom,
      dateTo: inputDateTo,
    };
    setActiveFilters(newFilters);
    void loadSources(newFilters);
  }

  function handleClearSearch() {
    setInputQuery(""); setInputAddedBy(""); setInputDateFrom(""); setInputDateTo("");
    setActiveFilters(emptyFilters);
    void loadSources(emptyFilters);
  }

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <main>
      <header>
        <h1>ContextHub</h1>
        <p className="subtitle">Manage the sources your context layer serves to the engine.</p>
      </header>

      {error && <div className="error">Error: {error}</div>}

      <section className="card">
        <h2>Add a source</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="note">note</option>
              <option value="doc">doc</option>
              <option value="snippet">snippet</option>
            </select>
          </label>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Content
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} required />
          </label>
          <label>
            Tags (comma-separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="onboarding, setup" />
          </label>
          <label>
            Added by (name)
            <input value={addedByName} onChange={(e) => setAddedByName(e.target.value)} required />
          </label>
          <label>
            Added by (email)
            <input type="email" value={addedByEmail} onChange={(e) => setAddedByEmail(e.target.value)} required />
          </label>
          <button type="submit">Add source</button>
        </form>
      </section>

      <section className="card">
        <h2>Sources ({sources.length})</h2>

        <form onSubmit={handleSearch}>
          <div className="preview-form">
            <input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Keyword search (optional)"
            />
            <input
              value={inputAddedBy}
              onChange={(e) => setInputAddedBy(e.target.value)}
              placeholder="Added by name or email"
            />
            <button type="submit">Search</button>
            {hasActiveFilters && (
              <button type="button" className="clear-btn" onClick={handleClearSearch}>
                Clear
              </button>
            )}
          </div>

          <div className="date-filter">
            <label>
              From
              <input type="date" value={inputDateFrom} onChange={(e) => setInputDateFrom(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={inputDateTo} onChange={(e) => setInputDateTo(e.target.value)} />
            </label>
          </div>
        </form>

        {hasActiveFilters && (
          <p className="muted">
            {[
              activeFilters.query && ("keyword: " + activeFilters.query),
              activeFilters.addedBy && ("added by: " + activeFilters.addedBy),
              (activeFilters.dateFrom || activeFilters.dateTo) &&
                ("date: " + (activeFilters.dateFrom || "...") + " to " + (activeFilters.dateTo || "...")),
            ]
              .filter(Boolean)
              .join(" | ")}
          </p>
        )}

        {loading ? (
          <p className="muted">Loading...</p>
        ) : sources.length === 0 ? (
          <p className="muted">
            {hasActiveFilters ? "No sources match your search." : "No sources yet. Add one above."}
          </p>
        ) : (
          <ul className="source-list">
            {sources.map((s) => (
              <li key={s.id}>
                <div className="source-body">
                  <div className="source-head">
                    {(scores.get(s.id) ?? 0) > 0 && (
                      <span className="score">{scores.get(s.id)}</span>
                    )}
                    <span className="badge">{s.type}</span>
                    <strong>{s.title}</strong>
                  </div>
                  <p className="content">{s.content}</p>
                  {s.tags.length > 0 && (
                    <div className="tags">
                      {s.tags.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  )}
                  <p className="meta">
                    Added by {s.addedByName} ({s.addedByEmail}) &middot;{" "}
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <button className="delete" onClick={() => handleDelete(s.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
