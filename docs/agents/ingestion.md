# Ingestion pipeline

Loaded on demand from `AGENTS.md`. Read this before changing upload, parsing,
chunking, embedding, or chunk storage. For structure and schema, see
[`architecture.md`](./architecture.md).

## Entry points

```
POST /api/sources/upload                     src/app/api/sources/upload/route.ts
→ uploadSourceFile(notebookId, file, title)   src/app/lib/sources/source.service.ts
→ ingestUploadedFile                          src/app/lib/sources/source-ingest/ingest-uploaded-file.ts
→ ingestDocumentFile                          src/app/lib/sources/source-ingest/ingest-document-file.ts
```

`maxDuration = 600`, `runtime = "nodejs"` — ingest is synchronous and may take
minutes for large PDFs. The client also has a queue
(`src/app/lib/sources/source-ingest-queue.ts`) that marks sources with
`metadata.ingestStatus === "processing"` and polls the embed endpoint, but the
server-side batch embedder is still a stub (see **Known gaps**).

## End-to-end flow

```
ingestDocumentFile
  1. resolveDocumentIngestProfile(fileName)        # extension → profile
  2. profile.extract(buffer, extension)            # → { fullText, units[], title? }
  3. uploadSourceBuffer({ fileBuffer, … })         # original file → Storage
  4. commitSourceIngest({ …, structuredUnits })
       a. createPendingSource                      # INSERT sources (processing)
       b. uploadIngestFigureImages                 # currently a no-op mapper
       c. buildChunkDraftsFromUnits(units, sourceId)
            – map units → drafts
            – embed every draft content
            – INSERT document_chunks in a transaction
       d. UPDATE sources                           # completed / ready + counts
```

### 1. Profile resolution

`src/app/lib/sources/source-ingest/documunt-profiles.ts` (name is misspelled)
maps a lowercased extension to a `DocumentIngestProfile`:

```ts
{ id, extensions, sourceType, structured, extract(buffer, extension) }
```

Only the `pdf` profile is enabled. Unsupported extensions throw; keep that error
message honest about what is actually supported.

### 2. PDF extraction — `src/utils/document/pdf-document.ts`

`extractPdfDocument(buffer, { includeTitle, includeImages })`:

- Initialises the `pdf-parse` worker once (`PDFParse.setWorker(getData())`) and
  destroys the parser in a `finally`.
- `parser.getText()` → pages. Each page's text is passed through
  `sanitizeSourceText` (strips NUL/C0 controls/BOM, collapses whitespace,
  trims).
- **Text chunking is LangChain-only**: one shared
  `RecursiveCharacterTextSplitter` with `chunkSize: 1000`,
  `chunkOverlap: 200`, applied **per page** via `splitText`. Chunk boundaries
  therefore reset on every page. Each returned chunk is sanitised again and
  dropped if empty, then pushed as `{ kind: "text", page, content }`.
- Images: `parser.getImage({ imageThreshold: 0, imageBuffer: true })`. Each
  image becomes a `kind: "figure"` unit whose `content` is
  `"Figure N (page P)"` plus up to 800 chars of that page's text, with
  `imageBuffer` and a sniffed `imageContentType`.
- `fullText` is the sanitised whole-document text (not chunked).
- Throws `"No text could be extracted from the PDF."` when both text and units
  are empty.
- `includeTitle` triggers a second `getInfo()` pass for PDF metadata title.

Unit order is per page: text chunk(s), then figure(s). That order determines
`chunkIndex` later — preserve it.

### 3. Original file storage

`uploadSourceBuffer` uploads to the `sources` bucket at
`${Date.now()}-${randomId}.${ext}` with `upsert: false`, resolves the content
type from extension (falling back to the provided MIME type), and returns
`{ storagePath, publicUrl }`. Both are persisted on the source row.

### 4. Source row

`createPendingSource` (`src/utils/sources/ingest-source.ts`):

- Sanitises text via `prepareSourceText`; rejects empty text.
- Stores `extractedText` only when ≤ `SOURCE_MAX_STORED_TEXT_CHARS` (50,000);
  larger documents persist `null` (`isStoredInChunksOnly: true`).
- Sets `metadata`: `ingestStatus: "processing"`, `embeddedChunkCount: 0`,
  `totalCharacters`, `isStoredInChunksOnly`.
- Returns `{ source }`.

### 5. Chunk construction + embedding — `src/app/lib/chunks/ingest-drafts.ts`

`buildChunkDraftsFromUnits(units, sourceId)` is the only writer of
`document_chunks`.

- `toChunkDraftsFromUnits(units)` (pure, exported): trims each unit's content,
  drops empty results, assigns a **contiguous global** `chunkIndex` after
  filtering, and writes `metadata: { kind, page, characterCount, imageUrl? }`.
- `buildChunkDraftsFromUnits` returns `[]` immediately when there are no drafts
  — no provider call, no write.
- Embeds **all** drafts first (`embedDocumentTexts`), then inserts. Provider or
  dimension failures therefore leave zero chunks behind.
- Rows are `{ sourceId, chunkIndex, content, metadata, embedding }`, inserted
  in batches of 100 inside one `db.transaction`; each batch uses `.returning()`
  and the accumulated `DocumentChunk[]` is returned to `commit.ts`.

### 6. Embedding client — `src/utils/embeddings/document-embeddings.ts`

- `OpenAIEmbeddings` from `@langchain/openai`, lazy singleton.
- Model: `EMBEDDING_MODEL` or `text-embedding-3-small`.
- `DOCUMENT_EMBEDDING_DIMENSIONS = 1536`, must equal the pgvector column.
- `dimensions: 1536` is passed only for `text-embedding-3*` models (others
  reject the parameter).
- `batchSize: 512`; `embedDocuments` splits into multiple requests.
- Every returned vector is validated against 1536 and a mismatch throws before
  any insert, naming `EMBEDDING_MODEL`.
- Missing key throws `"OPENAI_API_KEY is not set…"`.

### 7. Source finalisation — `commit.ts`

After chunks are written, `sources` is updated to `status: "completed"`,
`metadata.ingestStatus: "ready"`, `chunkCount` and `embeddedChunkCount` set to
the row count, plus `updatedAt`. The updated source is returned in the same
`{ source }` shape. If zero chunks were produced, the source is left
`processing` and returned unchanged.

## Failure behaviour

| Failure                           | Result                                            |
| --------------------------------- | ------------------------------------------------- |
| No units / all empty              | No embed call, no chunks, source stays processing |
| Missing/invalid key               | Clear error before insert; no chunks              |
| Provider error/timeout            | No chunks (embed happens before writes)           |
| Dimension mismatch                | Readable error before insert                      |
| Insert error in any batch         | Transaction rolls back all batches                |

Accepted trade-off: the source row and stored file exist before embedding. A
failed embed leaves a retryable `processing` source that nothing retries yet.

## Adding a document format

1. Create the extractor under `src/utils/document/` returning
   `{ fullText, units, title? }`. Reuse `DocumentIngestUnit` (`kind`, `page`,
   `content`); use LangChain for text splitting rather than hand-rolled logic.
2. Uncomment/add its profile in `documunt-profiles.ts`, with the correct
   `structured` flag (`false` means units are not persisted).
3. Add any missing value to the `source_type` enum in `src/db/schema.ts` and
   `sourceTypeSchema` in `src/types/source.type.ts`, then `drizzle-kit push`.
4. Add the upload content type in `upload-source-buffer.ts` if it is missing.
5. Tighten `DocumentIngestProfile.sourceType` from `any` to
   `Source["sourceType"]` if it is still loose.
6. Verify `npx tsc --noEmit` and `npm run lint`.

## Known gaps

- `uploadIngestFigureImages` is stubbed: it returns units stripped of image
  buffers and never sets `imageUrl`, so figure chunks are text-only and
  `metadata.imageUrl` is always absent.
- `embedNextSourceBatch` (`src/utils/sources/ingest-source.ts`) is a stub that
  returns `done: true, embeddedChunkCount: 0, chunksCount: 0`. The embed route
  and client queue therefore do nothing; embedding happens during upload.
- Only PDF is enabled; Word/Excel/plain-text profiles are commented out and
  their modules do not exist.
- No `UNIQUE (source_id, chunk_index)` — re-ingesting duplicates chunks.
- No vector index — similarity queries would seq-scan.
- Chunking is per page, so paragraphs spanning page breaks are split.
- No token-count metadata; only `characterCount`.
- `commit.ts` uses the **browser** Supabase client on the server. Replace with
  a server client when authenticated storage or figures are implemented.
