# Architecture

Loaded on demand from `AGENTS.md`. Covers project structure, module boundaries,
and the data layer. For the upload → chunks pipeline, read
[`ingestion.md`](./ingestion.md).

## Layout

```
src/app/                  App Router: pages, route handlers, feature services
  (main)/notebook/        notebook UI routes
  api/                    route handlers (validate → service → apiSuccess/apiError)
  lib/sources/            upload entry points + source.service.ts
  lib/sources/source-ingest/
                          ingest pipeline: profiles, commit, storage upload
  lib/chunks/             units → document_chunks (embedding + persistence)
  lib/supabase/           Supabase client(s)
  lib/contants/           shared constants (directory name is misspelled)
src/components/           app components; components/ui is generated shadcn UI
src/db/                   Drizzle schema (schema.ts) + connection (index.ts)
src/hooks/                React hooks
src/providers/            React providers (QueryClient)
src/tanstack/             client/, queries/, api.ts — all client-side data access
src/types/                Zod schemas + shared types (barrel: src/types/index.ts)
src/utils/                framework-agnostic, server-oriented helpers
  document/               parsers (PDF, figure upload)
  embeddings/             OpenAI embedding client
  sources/                sanitize, prepare, source row creation
```

## Module boundaries

- **Pages/components** (`src/app/(main)`, `src/components`) are client or
  server components. They call hooks/queries, never `db` and never Axios
  directly.
- **Route handlers** (`src/app/api`) are thin: parse + Zod-validate input, call
  a service from `src/app/lib`, wrap the result with `apiSuccess`/`apiError`.
- **Feature services** (`src/app/lib`) orchestrate: storage, DB writes, ingest.
  This is where multi-step workflows belong.
- **`src/utils`** holds helpers with no React/Next dependency. `document/` and
  `embeddings/` are server-only in practice (Node APIs, API keys).
- **`src/tanstack`** owns every browser-side request: `api.ts` (Axios instance
  + error normalisation), `client/*.client.ts` (endpoint wrappers),
  `queries/*` (query keys + hooks).
- **`src/types`** is the shared contract layer. Business types/schemas go
  there; `src/types/types.ts` holds ingest-facing interfaces and is **not**
  re-exported from the barrel.

## Data layer

`src/db/schema.ts` defines three tables:

| Table             | Notes                                                        |
| ----------------- | ------------------------------------------------------------ |
| `notebooks`       | id, title, description, timestamps                           |
| `sources`         | belongs to a notebook; `sourceType` enum, `status` enum, `metadata` jsonb |
| `document_chunks` | belongs to a source; `chunkIndex`, `content`, `metadata` jsonb, `embedding vector(1536)` |

Conventions:

- `metadata` columns are untyped (`jsonb` → `unknown` in Drizzle). Cast to
  `SourceMetadata` (Zod-derived) when reading known fields.
- `sources.metadata` carries ingest bookkeeping: `ingestStatus`
  (`processing`/`ready`/`failed`), `chunkCount`, `embeddedChunkCount`,
  `totalCharacters`, `isStoredInChunksOnly`, `ingestError`.
- Export `$inferSelect` types next to their tables (`Notebook`, `Source`,
  `DocumentChunk`).
- Apply schema changes with `npx drizzle-kit push` in dev. No `drizzle/`
  migrations directory exists yet; `drizzle-kit generate` starts one when you
  need committed SQL.

### pgvector

- Dimension is fixed at **1536**; it must match the embedding model constant.
- There is currently **no vector index** and **no unique constraint**. When
  retrieval lands, add:
  - `CREATE INDEX … USING hnsw (embedding vector_cosine_ops)` (HNSW caps at
    2,000 dims for `vector`, so 1536 is fine),
  - `UNIQUE (source_id, chunk_index)` to make re-ingest idempotent.
- OpenAI vectors are unit-normalised, so cosine and inner product rank the
  same; use cosine for convention.

## Supabase

- `src/app/lib/supabase/client.ts` is a **browser** client
  (`createBrowserClient`). Server code currently imports it in
  `source-ingest/commit.ts`; if you need authenticated or privileged storage
  work, add a server client (`createServerClient` with cookies) instead of
  reusing this one.
- The storage bucket is `sources`; public URLs are produced by
  `uploadSourceBuffer`.

## Known gaps

- `documunt-profiles.ts` and `contants/` are misspelled. Keep the paths unless
  you rename file/directory **and** every import in one change.
- `src/app/api/notebooks/route.ts` predates the API helpers and returns
  `{ status, data, error }` instead of `{ success, data, error }`. Use the
  helpers for new routes; migrate the old one only when touching it.
- `DocumentIngestProfile.sourceType` is typed `any`. Tighten it to
  `Source["sourceType"]` when enabling non-PDF formats — the `source_type` enum
  currently has no `word`/`spreadsheet` values.
- `src/app/lib/sources/source-ingest-queue.ts` polls `embedSourceBatch` until
  `done`, but the server implementation is a stub (see `ingestion.md`).

## Where to add things

| Adding…                | Put it in                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| A new API route        | `src/app/api/<resource>/route.ts` + a service in `src/app/lib`   |
| A new screen           | `src/app/(main)/…` + components in `src/components`              |
| A new client request   | `src/tanstack/client/*.client.ts` + `src/tanstack/queries/*`     |
| A new shared type      | Zod schema in `src/types/*.type.ts`, export from the barrel      |
| A new table/column     | `src/db/schema.ts`, then `drizzle-kit push`                      |
| A new document format  | Follow the recipe at the end of `ingestion.md`                   |
