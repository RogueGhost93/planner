# Contributing to Oikos

Thanks for your interest in contributing. Oikos is a small, opinionated project — this guide covers the constraints and conventions you need to know before submitting code.

## Ground Rules

**Oikos has a hard "no frameworks, no build tools" constraint.** This is not a temporary limitation — it's an architectural decision. Specifically:

- No React, Vue, Svelte, Angular, or any frontend framework
- No Webpack, Vite, Rollup, esbuild, or any bundler
- No TypeScript (plain JavaScript with ES modules)
- No CSS libraries (Tailwind, Bootstrap, etc.)
- No external frontend dependencies except Lucide Icons (self-hosted SVG sprite)

If your contribution requires adding a frontend dependency, it will not be merged. Backend dependencies are evaluated case-by-case but should remain minimal.

## Getting Started

```bash
git clone https://github.com/ulsklyc/oikos.git
cd oikos
npm install
cp .env.example .env
# Set SESSION_SECRET — skip DB_ENCRYPTION_KEY for local dev
npm run dev
```

Run tests before submitting:

```bash
npm test    # Requires Node >=22 (uses --experimental-sqlite)
```

## Code Conventions

### General

- ES modules everywhere (`import`/`export`, never `require`)
- Semicolons: **yes**
- Header comment in every file: purpose, module, dependencies
- `try/catch` in every route handler — no unhandled promise rejections
- No `eval()`, no `innerHTML` with user input — use `textContent` or DOM API

### Frontend

- Web Component prefix: `oikos-` (one component per file)
- All UI text in **German** (the app targets German-speaking families)
- Date format: `DD.MM.YYYY` — Time format: `HH:MM` (24h)
- Pages are ES modules in `public/pages/` that export a `render()` function
- CSS uses design tokens from `public/styles/tokens.css` — don't hardcode colors or radii

### Backend

- API routes live in `server/routes/`, one file per module
- API responses: `{ data: ... }` on success, `{ error: string, code: number }` on failure
- Database migrations go in the `migrations` array in `server/db.js` — **append only, never modify existing entries**
- Every table: `id INTEGER PRIMARY KEY`, `created_at TEXT`, `updated_at TEXT`

### Testing

- Tests use the Node.js built-in test runner with in-memory SQLite (`--experimental-sqlite`)
- One test file per module in `tests/`
- No running server needed — tests import route handlers directly

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes following the conventions above
3. Add or update tests if applicable
4. Run `npm test` and make sure all tests pass
5. Open a pull request with a clear description of what and why

Keep PRs focused. One feature or fix per PR. Large refactors should be discussed in an issue first.

## Reporting Bugs

[Open an issue](https://github.com/ulsklyc/oikos/issues/new) with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment (browser, OS, Docker version if relevant)

## Feature Requests

[Open an issue](https://github.com/ulsklyc/oikos/issues/new) describing the use case. Explain the problem before proposing a solution — there might be a simpler approach that fits the existing architecture.

Features that conflict with the project's constraints (see above) or significantly expand scope will likely be declined. When in doubt, ask first.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
