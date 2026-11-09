# RAG chat assistant

Floating chat widget (the "chat-launcher orb" from `DESIGN.md`) that answers visitor questions
using the site's own content — services, solutions, industries, technologies, FAQs, pricing
plans, blog posts, and case studies — via retrieval-augmented generation (RAG).

Gated behind the `floating_chat_assistant` feature flag (default **off**). Toggle it in
`/admin/feature-flags` once setup below is done.

## Architecture

```
Visitor types a question
        │
        ▼
FloatingChatWidget (client)  ──POST /api/chat──▶  route.ts
                                                     │
                                     1. embed the question (Gemini)
                                     2. $vectorSearch KnowledgeChunk (Atlas)
                                     3. build system prompt + retrieved context
                                     4. stream a Gemini response back
                                                     │
        ◀── streamed plain-text response ───────────┘
```

One provider for both calls — same `GEMINI_API_KEY`, no OpenAI/Ollama dependency. Both are
called directly over REST (no SDK), matching the existing fetch-based style in this codebase:

| Step | Provider | Endpoint |
| --- | --- | --- |
| **Embeddings** (retrieval) | Gemini, `gemini-embedding-001` (3072 dims) | REST `batchEmbedContents` |
| **Generation** (the answer) | Gemini, `gemini-3.7-flash` by default | REST `streamGenerateContent` (SSE) |

## Files

| File | Purpose |
| --- | --- |
| `prisma/schema.prisma` → `KnowledgeChunk` | One row per embedded chunk of site content. |
| `src/lib/rag/chunk.ts` | Paragraph-aware text chunking (~1200 chars/chunk). |
| `src/lib/rag/embeddings.ts` | Calls Gemini's `batchEmbedContents` endpoint (batched, 100 inputs/request). Exports `EMBEDDING_DIMENSIONS` (3072, for `gemini-embedding-001`). |
| `src/lib/rag/retrieve.ts` | Embeds a query and runs `$vectorSearch` via `prisma.$runCommandRaw` (Prisma has no native vector-search API). |
| `src/lib/rag/custom-knowledge.ts` | Add/list/delete custom knowledge documents (`sourceType: "custom_upload"`) — used by the admin upload page. |
| `scripts/rag/create-vector-index.ts` | One-time: creates the Atlas Search vector index on `KnowledgeChunk.embedding`. |
| `scripts/rag/build-knowledge-base.ts` | Ingestion: pulls current CMS content, chunks + embeds it, replaces `KnowledgeChunk` rows (custom uploads excluded). |
| `src/app/api/chat/route.ts` | POST endpoint. Validates the flag + payload, retrieves context, streams Gemini's answer over REST SSE. |
| `src/app/admin/knowledge-base/` + `src/app/api/admin/knowledge-base/` | Admin page to paste text or upload `.txt`/`.md` files straight into `KnowledgeChunk`, outside the CMS-driven ingestion. |
| `src/components/FloatingChatWidget.tsx` | The floating orb + chat panel UI. Mounted in `src/app/layout.tsx`. |
| `src/lib/feature-flags-schema.ts` | `floating_chat_assistant` flag definition. |

## Data model

```prisma
model KnowledgeChunk {
  id         String   @id @default(cuid()) @map("_id")
  sourceType String   // "service" | "solution" | "industry" | "technology" | "faq"
                       // | "pricing_plan" | "blog_post" | "case_study"
  sourceId   String   // Prisma id (CMS entities/FAQ/pricing) or slug (blog/case study)
  chunkIndex Int      @default(0)
  title      String
  content    String
  url        String?  // e.g. /services/ai-development — omitted when there's no public page
  embedding  Float[]  // 3072 dims (gemini-embedding-001)
  updatedAt  DateTime @updatedAt

  @@unique([sourceType, sourceId, chunkIndex])
  @@index([sourceType, sourceId])
}
```

Retrieval reads this collection through an **Atlas Search vector index** named
`knowledge_vector_index` (cosine similarity on `embedding`) — this is separate from a normal
MongoDB/Prisma index and isn't managed by `prisma db push`.

## Environment variables

```sh
# Generation + embeddings — one key for both
GEMINI_API_KEY=                           # required — aistudio.google.com/apikey
GEMINI_MODEL=gemini-3.7-flash             # optional override
GEMINI_EMBEDDING_MODEL=gemini-embedding-001  # optional override

# Retrieval
DATABASE_URL=                             # MongoDB Atlas — Network Access must allow this host's IP
```

## Setup (one-time, then after content changes)

```sh
npm run rag:index                # create the Atlas vector index (once)
npm run rag:build                # embed current site content into KnowledgeChunk
```

Then in `/admin/feature-flags`, enable **"Floating AI chat assistant"**.

Re-run `npm run rag:build` whenever content in the sources listed below changes meaningfully
(new/edited services, blog posts, case studies, FAQs, etc.) — it's a full rebuild of the
CMS-sourced rows (`deleteMany` + `createMany`), not incremental, so it's always safe to re-run.
**Custom knowledge added via `/admin/knowledge-base` (below) is untouched by this** — only rows
with `sourceType !== "custom_upload"` are replaced.

### Content sources indexed by `rag:build`

| Source | Query | Filter |
| --- | --- | --- |
| Services / Solutions / Industries / Technologies | `prisma.<model>.findMany()` | `isActive: true` |
| FAQ | `prisma.faq.findMany()` | `isActive: true` |
| Pricing plans | `prisma.pricingPlan.findMany()` | `isActive: true` |
| Blog posts | `readBlogPosts()` + `publishedBlogPosts()` | status `published` |
| Case studies | `readCaseStudies()` | none (no draft state) |

HTML bodies (blog/case-study) are converted to plain text via `turndown` before chunking.

## Adding custom knowledge (`/admin/knowledge-base`)

For content that isn't one of the CMS models above — a policy doc, interview-bank material,
raw notes, anything you just want the bot to know — use the admin page instead of extending
`rag:build`:

1. Go to `/admin/knowledge-base` (nav: Content → "Chat knowledge").
2. Paste text directly, and/or attach a `.txt`, `.md`, or `.pdf` file (drag onto the content box,
   or use the upload button) — the file itself is sent on submit; text isn't extracted until then.
3. Give it a title and, optionally, a source URL. Submitting sends `multipart/form-data` to
   `POST /api/admin/knowledge-base`, which extracts text server-side (`pdf-parse` for PDFs — see
   `extractTextFromUpload` in `src/lib/rag/custom-knowledge.ts`, which also strips pdf-parse's
   `-- N of M --` page markers), appends it to any pasted text, then chunks + embeds — no script
   to run. Max upload size 15MB.
4. Each entry is listed with its chunk count and can be deleted (`DELETE
   /api/admin/knowledge-base/[sourceId]`), which removes every chunk for that document.

Stored with `sourceType: "custom_upload"` and a random `sourceId` (`crypto.randomUUID()`), so it
survives `npm run rag:build` reruns and never collides with CMS-sourced rows. Max content size
per entry is 200,000 characters (`MAX_CUSTOM_CONTENT_LENGTH` in `src/lib/rag/custom-knowledge.ts`).
Embedding still runs through Gemini — no upload works without `GEMINI_API_KEY` set.

## Request contract (`POST /api/chat`)

```jsonc
// Request
{ "messages": [{ "role": "user" | "assistant", "content": "..." }] }
// last message must be role "user"; history capped at 10 messages, 4000 chars each

// Response: streamed text/plain body (raw token deltas, not SSE/JSON)
```

The route:
1. 503s if the feature flag is off or `GEMINI_API_KEY` is unset.
2. Embeds the last user message and runs `retrieveRelevantChunks(query, 5)` (same key).
3. If retrieval throws (index still `BUILDING`, Gemini unreachable, etc.) it **degrades
   gracefully** — logs the error and answers without site-specific context rather than failing
   the request.
4. Builds a system prompt instructing Gemini to answer only from the provided `CONTEXT` block,
   cite URLs when given, and point to `/contact` when the context doesn't cover the question.
5. Streams the response from Gemini's `streamGenerateContent?alt=sse` endpoint, parsed as raw
   SSE (no SDK).
6. If Gemini's `finishReason` isn't `STOP`/`MAX_TOKENS` (e.g. `SAFETY`), appends a fallback
   message pointing to `/contact`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `rag:build`/`rag:index` fail with `Server selection timeout` / `tlsv1 alert internal error` | Current IP not in Atlas **Network Access** allow list (Atlas aborts the TLS handshake, not just the TCP connect) | Atlas → Network Access → add the machine's public IP (or `0.0.0.0/0` for local dev only — narrow it back down afterward) |
| `/api/chat` answers with no site-specific detail | Vector index still `BUILDING`, or `KnowledgeChunk` is empty | Check index status in Atlas → Search; re-run `npm run rag:build` |
| Chat 503s | `floating_chat_assistant` flag off, or `GEMINI_API_KEY` unset | Enable flag in `/admin/feature-flags`; set the key in `.env` |
| Embedding calls fail with 401 | `GEMINI_API_KEY` invalid/revoked | Verify with `curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"`; get a fresh key at aistudio.google.com/apikey |
| Generation fails with 404 naming the model | Google retired that model ID (happened to `gemini-2.0-flash`) | List current models with the same `curl` above (filter for `generateContent` support) and update `GEMINI_MODEL` |
| Changed `GEMINI_EMBEDDING_MODEL` to a model with different output size | `EMBEDDING_DIMENSIONS` in `embeddings.ts` no longer matches the Atlas index | Update `EMBEDDING_DIMENSIONS`, then re-run **both** `rag:index` (drop+recreate — already handled by the script) and `rag:build` |
| `Setting up fake worker failed: Cannot find module '.../pdf.worker.mjs'` | Next's bundler (Turbopack/webpack) was bundling `pdf-parse`'s `pdfjs-dist` dependency, breaking its runtime worker-path resolution | Fixed via `serverExternalPackages: ["pdf-parse", "pdfjs-dist"]` in `next.config.ts` — if you see this again after touching that config, check it's still there |

## Notes / deliberate choices

- **CMS ingestion is a full rebuild, not incremental** (custom uploads are the exception — they're
  additive/manual). Simpler and safe to re-run; the content set is small enough (currently ~90
  CMS chunks) that this costs a few seconds locally.
- **Gemini for both, one key.** Simpler ops (one API key, one billing account, one rate-limit
  pool to watch) than splitting generation and embeddings across providers. Embeddings only run
  on ingestion (`rag:build`) and admin knowledge-base uploads, not per chat message, so the
  embedding side of the cost stays low regardless.
- **`prisma.$runCommandRaw`** is used for `$vectorSearch` and `createSearchIndexes` because Prisma
  has no first-class API for either — these are raw MongoDB/Atlas commands.
- **Called directly over REST/SSE, no SDK dependency** — matches the fetch-based style already
  used for Ollama-backed features in this codebase, and avoids an extra dependency for two fairly
  simple REST calls.
- **Model IDs drift.** Google retires models (this project already hit `gemini-2.0-flash` 404ing);
  re-verify `GEMINI_MODEL`/`GEMINI_EMBEDDING_MODEL` against the live `/v1beta/models` list
  (see Troubleshooting) if generation or embedding calls start failing with 404.
