# CLAUDE.md Migration Summary

## Result

| | Lines |
|---|---|
| Before | 82 |
| After | 50 |
| Reduction | -39% (-32 lines) |

## What was removed and why

| Removed | Reason |
|---|---|
| `## Quick Reference` commands block (6 lines) | `npm start`, `npm run dev`, `npm test` are all in `package.json scripts`. Claude reads `package.json` on demand. `docker compose up -d` is a deployment detail, not a development constraint. |
| "These are non-negotiable. Every violation is a bug." intro | Moved to tighter one-liner before the list. |
| Full directory tree (21 lines) | Claude navigates the filesystem directly. Listing every file adds no behavioral value. Only non-obvious locations were kept. |
| "Pages are ES modules" standalone paragraph | Merged into Conventions. |
| Semicolons | Inferrable from reading any source file. |
| Header comment convention | Already documented in `CONTRIBUTING.md`. |
| DB table column pattern (`id`, `created_at`, `updated_at`) | Already in `CONTRIBUTING.md`. |
| Commit format and Changelog instructions (2 lines) | Already in `CONTRIBUTING.md`. Claude can read it when committing. |
| `## Current State` paragraph | Describes finished features - zero behavioral value. Becomes stale immediately. |
| "When to consult" column from Reference table | Padding. Claude decides when to read reference docs based on task context. |

## What moved to rules files

None. The remaining content is either universal (applies to every file) or a short pointer. No subsystem-specific rules justify a separate file at this project size.

## What was kept and why

| Kept | Why |
|---|---|
| All 8 Hard Constraints | Each prevents a class of wrong code that Claude would otherwise produce. The no-frameworks rule in particular would be violated without an explicit reminder. |
| API response shape `{data}` / `{error, code}` | Not inferrable without reading multiple route files. Applies to every new route. |
| `formatDate()`/`formatTime()` | Without this, Claude formats dates manually (e.g. `new Date().toLocaleDateString()`), producing inconsistent output. |
| `pages/*.js` → `render()`, no side effects | Structural contract not obvious from reading one page file. |
| `oikos-` prefix | Web Component naming convention. |
| Non-obvious file locations (`i18n.js`, `api.js`, `router.js`) | These live at `public/` root, not in a subdirectory. Easy to miss when navigating. |
| Request flow one-liner | Architectural orientation for new tasks. |
| Reference table (trimmed) | On-demand pointers replace inline content for spec details. |

## Token delta estimate

At ~4 chars/token average for this content:
- Before: ~1,800 tokens loaded every session
- After: ~1,100 tokens loaded every session
- Savings: ~700 tokens per session
