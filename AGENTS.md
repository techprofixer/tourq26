<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Code reuse guardrails

Before writing new code, search the codebase for an existing implementation of the same concept (grep for similar names/types, check sibling modules under `src/lib/`, `src/components/`). If one exists:

- Extend or generalize it in place. Do not create a second module/function that does almost the same thing (e.g. `entity-catalog.ts` replacing `services-catalog.ts` — the old file must be deleted, not left alongside the new one).
- If two call sites need slightly different behavior, add a parameter/option to the shared implementation rather than forking it.
- Match the existing file's conventions (naming, export shape, error handling) instead of introducing a new pattern for the same kind of problem.
- Before finishing a refactor that renames or replaces a module, `grep` for the old name across the repo to confirm no dangling imports or leftover duplicate files remain.

Only create a new abstraction when no existing one fits and the duplication would otherwise span 3+ call sites — don't pre-build abstractions for a single use.
