# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` contains the Cloudflare Worker entry point (`fetch` handler).
- `test/` holds Vitest tests and Cloudflare test harness setup (e.g., `test/index.spec.ts`).
- Config lives at the repo root: `wrangler.jsonc`, `tsconfig.json`, `vitest.config.mts`, and `worker-configuration.d.ts`.
- Package metadata and tooling are in `package.json` and `bun.lock`.

## Build, Test, and Development Commands
- `bun run dev` or `bun run start`: run the local Workers dev server via Wrangler.
- `bun run deploy`: deploy the Worker with Wrangler.
- `bun run test`: run Vitest test suite.
- `bun run cf-typegen`: regenerate `Env` typings from `wrangler.jsonc`.

## Coding Style & Naming Conventions
- Indentation uses tabs; line endings are LF; trailing whitespace trimmed (`.editorconfig`).
- Prettier config: 140 char line width, single quotes, semicolons, tabs (`.prettierrc`).
- TypeScript files use `.ts` extensions; tests follow `*.spec.ts` naming in `test/`.

## Testing Guidelines
- Tests run with Vitest and the Cloudflare Workers test pool.
- Place unit or integration tests in `test/` and name them `*.spec.ts`.
- Run a single file with `bun run test -- test/index.spec.ts`.
- Update snapshots with `bun run test -- -u` when needed.

## Commit & Pull Request Guidelines
- Commit messages are short and imperative in history (e.g., “add …”); follow that style.
- PRs should include a clear description, rationale, and how you tested (command + result).
- Link relevant issues; include config changes if bindings or environments are touched.

## Configuration & Secrets
- Bindings and environment settings live in `wrangler.jsonc`; run `bun run cf-typegen` after edits.
- Keep secrets out of the repo; use Wrangler secret/config management instead of committing values.
