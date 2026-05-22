import { useEffect, useState, type FormEvent } from "react";
import type { Source } from "./types";
import { listSources, createSource, deleteSource } from "./api";

export function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controlled form fields.
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setSources(await listSources());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Load sources once when the component first mounts.
  useEffect(() => {
    void refresh();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createSource({
        type,
        title,
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setTitle("");
      setContent("");
      setTags("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSource(id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

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
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="onboarding, setup"
            />
          </label>
          <button type="submit">Add source</button>
        </form>
      </section>

      <section className="card">
        <h2>Sources ({sources.length})</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : sources.length === 0 ? (
          <p className="muted">No sources yet. Add one above.</p>
        ) : (
          <ul className="source-list">
            {sources.map((s) => (
              <li key={s.id}>
                <div className="source-body">
                  <div className="source-head">
                    <span className="badge">{s.type}</span>
                    <strong>{s.title}</strong>
                  </div>
                  <p className="content">{s.content}</p>
                  {s.tags.length > 0 && (
                    <div className="tags">
                      {s.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
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
