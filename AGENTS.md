<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Guidance for coding agents working in this repository. `CLAUDE.md` imports this
file, so everything here applies to both. Keep this file lean; task-specific
detail lives in `docs/agents/` and is loaded on demand.

## What this project is

A RAG (retrieval-augmented generation) notebook app. Users create notebooks and
upload sources (PDF today, more formats scaffolded). Uploaded files are parsed,
chunked, embedded, and stored as pgvector embeddings for semantic retrieval.

## Stack

| Concern         | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Framework       | Next.js 16 (App Router, React 19, RSC)                       |
| Language        | TypeScript, `strict: true`, `@/*` → `src/*`                  |
| Database        | PostgreSQL (Supabase) + `pgvector`, Drizzle ORM              |
| Validation      | Zod (schemas in `src/types`)                                 |
| Client data     | TanStack Query + Axios (`src/tanstack`)                      |
| UI              | shadcn-style components on Base UI, Tailwind v4              |
| Parsing         | `pdf-parse`; chunking via `@langchain/textsplitters`         |
| Embeddings      | `@langchain/openai`, `text-embedding-3-small` (1536)         |
| Package manager | npm (`package-lock.json` is committed)                       |

## Commands

```bash
npm run dev               # dev server
npm run build             # production build
npm run lint              # ESLint (eslint-config-next)
npx tsc --noEmit          # typecheck — run before finishing any change
npx drizzle-kit push      # apply schema in dev
npx drizzle-kit generate  # generate SQL once a drizzle/ dir exists
```

There is **no test runner** configured. Never invent `npm test`; verify with
`tsc` and `lint`. The README's `bun` references are stale — use npm.

## Environment

Read env through `src/env.ts` (Zod-validated); do not touch `process.env` in
feature code. `.env*` is gitignored — never commit, log, or print secrets.

- Required: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Optional: `OPENAI_API_KEY` (required to embed), `EMBEDDING_MODEL`,
  `OPENROUTER_API_KEY`

## Non-negotiables

- **Embedding dimension is 1536 everywhere.** `document_chunks.embedding` is
  `vector(1536)` and `DOCUMENT_EMBEDDING_DIMENSIONS` must match. Changing
  either requires a migration **and** re-embedding every chunk.
- **Documents and queries must use the same embedding model.** Never mix
  providers or models between ingest and retrieval.
- **Embed first, insert second.** Chunks are embedded before any write and
  inserted in one transaction (batches of 100), so failures leave no partial
  chunks.
- **DB access is server-only.** Import `db` from `@/db` only in route handlers,
  services, and utilities they call.
- **New API routes use `apiSuccess`/`apiError`** from `@/utils/api-route`, and
  validation errors are thrown as `new Error("Validation failed: …")` (maps to
  HTTP 400).
- **`src/components/ui/*` is generated.** Compose those components; don't fork
  them. Use `cn` from `@/lib/utils`; theme lives in `src/app/globals.css`.
- **No new debug logging.** Existing `console.log("🚀 …")` lines are legacy;
  use `console.error` for real failures only.

## Read before you edit

| If the task involves…                                  | Read                              |
| ------------------------------------------------------ | --------------------------------- |
| Upload, parsing, chunking, embeddings, chunk storage   | `docs/agents/ingestion.md`        |
| Project structure, module boundaries, schema, pgvector | `docs/agents/architecture.md`     |

## Definition of done

1. `npx tsc --noEmit` passes.
2. `npm run lint` passes.
3. Schema changes are reflected in `src/db/schema.ts` and pushed/generated.
4. No secrets, `.env*`, or debug logging added.
5. Ingestion changes preserve the invariants above (dimension, model pairing,
   embed-before-insert).
