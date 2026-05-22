# ContextHub

A **context layer** service. It gathers data from sources, stores it, and assembles
relevant context bundles that a workflow engine requests over an HTTP API.

## Architecture

This is an npm-workspaces monorepo:

```
contexthub/
  packages/
    server/   # backend API (Express + TypeScript)
    web/      # frontend dashboard (added in Phase 4)
```

The **server** owns the data and exposes the API. The **engine** (built by another
team) is a client of the server — it calls `GET /context?q=...` to retrieve assembled
context. ContextHub never calls the engine; the engine calls ContextHub. That one-way
dependency is the integration contract.

## Develop

```
npm install        # installs all workspace dependencies
npm run dev         # start the server in watch mode
npm test            # run the test suite
npm run build       # type-check and compile to dist/
```

## API

| Method | Path             | Purpose                                  |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/health`        | Liveness check                           |
| GET    | `/sources`       | List all sources                         |
| POST   | `/sources`       | Create a source                          |
| GET    | `/sources/:id`   | Fetch one source                         |
| PUT    | `/sources/:id`   | Update a source (partial)                |
| DELETE | `/sources/:id`   | Delete a source                          |
| GET    | `/context`       | Assemble relevant context for a query    |

A **source** has: `type` (`note` \| `doc` \| `snippet`), `title`, `content`, and `tags`
(an array of strings). Request bodies are validated with zod; invalid input returns
`400` with details.

### Context assembly

`GET /context?q=<query>&limit=<n>` is the endpoint the workflow engine calls. It scores
every source against the query (title matches weighted highest, then tags, then content),
drops non-matches, ranks the rest, and returns the top `limit` (default 5) as a bundle:

```jsonc
{
  "query": "deploy",
  "results": [{ "source": { /* ... */ }, "score": 6 }],
  "text": "## Deployment runbook\nHow to deploy the service.",
  "assembledAt": "2026-..."
}
```

`text` is all selected sources stitched together, ready to drop into a prompt.
