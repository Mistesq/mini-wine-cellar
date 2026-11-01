# Current Feature: Monorepo Phase 1 - Tooling, Shared Package and Postgres

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

Spec: `context/features/monorepo-phase-1-spec.md`, branch `spec/1-setup-monorepo` from `feat/wine-cellar`.

- [x] api boilerplate removed: `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`, `test/` (e2e test, `jest-e2e.json`), `test:e2e` and `deploy` scripts, `@nestjs/mau`; `AppModule` stays, empty
- [x] web boilerplate removed: demo `page.tsx` replaced with a minimal heading, `public/*.svg` deleted
- [x] Both scaffold `README.md` files deleted (`apps/api`, `apps/web`)
- [x] API default port is 4000 (`PORT` env); api reads only `PORT`, no `.env` loading yet
- [x] One root `biome.json` for all workspaces: `recommended` + `noExplicitAny`, `noUnusedImports`, `noUnusedVariables` as `error`; `next` and `react` domains only for `apps/web` (overrides)
- [x] `apps/web/biome.json`, `apps/api/oxlint.json`, `apps/api/.prettierrc` deleted; oxlint and Prettier deps and scripts removed; no `lint` / `format` scripts in workspaces (root only); api reformatted once with Biome
- [x] Strict flags in each workspace's own tsconfig (api, web, shared): `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`; each app keeps its own TypeScript major
- [x] `packages/shared` (`@mini-wine-cellar/shared`): `BOTTLE_LIMITS` (text 1-100, photoUrl max 2048, vintage min 1900) and `getMaxVintage(now?)` (current UTC year); no runtime deps; own `tsc` to CommonJS + `.d.ts` in `dist/`, exposed through `exports`
- [x] Shared build runs automatically: root `prepare` and `predev`, `pretest`, `pretypecheck` (`build` builds shared first via workspace order)
- [x] Root `package.json`: `engines.node` `^22.22.3 || ^24.15.0 || >=26.0.0` (max of the dependency minimums), workspaces with `packages/*` first, devDeps Biome + `concurrently`
- [x] Root scripts: `dev` (api + web via `concurrently`, named colored output), `build`, `lint` (`biome check .`), `format` (`biome check --write .`), `typecheck`, `test` (`--workspaces --if-present`)
- [x] Each workspace has its own `typecheck` (web: `next typegen && tsc --noEmit`)
- [x] Jest in web via `next/jest` (node env, co-located `*.test.ts`)
- [x] Jest in shared via ts-jest with a test for `BOTTLE_LIMITS` and `getMaxVintage`; api keeps its Jest config
- [x] api and web `test` scripts use `--passWithNoTests` temporarily (removed in spec 2 for api, spec 5 for web)
- [x] `docker-compose.yml`: Postgres pinned to the latest stable major supported by MikroORM, named volume at `/var/lib/postgresql`, healthcheck, port 5432, credentials from env with local fallbacks
- [x] `apps/api/.env.example` (`PORT`, `DATABASE_URL`, `CORS_ORIGIN`) and `apps/web/.env.example` (`NEXT_PUBLIC_API_URL`)
- [x] `.claude/settings.json` allows `docker compose` and the MikroORM CLI
- [x] `CLAUDE.md` Commands and `AGENTS.md` versions updated

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

Docs: Context7 or installed docs for Biome 2.4, `next/jest` (`node_modules/next/dist/docs/`) and npm workspaces.

Gotchas:

- `npm run dev --workspaces` runs workspaces sequentially and blocks on the first server, hence `concurrently` (approved root devDependency).
- Biome + Nest: `useImportType` must not turn DI-injected classes into `import type` (breaks `emitDecoratorMetadata`). Turn it off for `apps/api` if it fires. Check that parameter decorators (`@Args()`) parse.
- `shared` uses `module: nodenext` without `"type": "module"`, so it emits CommonJS for both Nest and Next.js.
- `--workspaces` follows the order of the `workspaces` array, so `packages/*` goes first.
- `next typegen` output must still pass with `noUnusedLocals` / `noUnusedParameters`.
- Compose credentials are local dev defaults read from env with fallbacks; real `.env` files stay gitignored.

Out of scope: MikroORM, entities, migrations, `.env` loading via `process.loadEnvFile` (spec 2); GraphQL, CORS, guard (spec 3); any web UI beyond a minimal heading.

Implementation decisions (candidates for `docs/decisions.md` on complete):

- Biome override for `apps/api`: `useImportType` off (it fired on a DI-injected class) and `javascript.parser.unsafeParameterDecoratorsEnabled` on (`@Param()` was a parse error without it). Both verified with a throwaway file.
- `apps/web/tsconfig.json` excludes `.next/dev/types/**`: the `validator.ts` that `next dev` writes there has unused imports and fails `noUnusedLocals`; Next re-adds the path to `include`, so `exclude` is the only stable fix. The clean copy in `.next/types` (from `next typegen` / `next build`) is still checked.
- Postgres 18 (`postgres:18-alpine`): 19 is only RC on Docker Hub; MikroORM 7.2 uses `pg` 8, which supports 18.
- api `supertest` / `@types/supertest` removed with the e2e test (no other user). `*.tsbuildinfo` added to the root `.gitignore` (`nest build` writes one). `apps/web/.gitignore` un-ignores `.env.example`.
- Layout metadata title/description changed from the create-next-app defaults.
- Root `engines.node` is `^22.22.3 || ^24.15.0 || >=26.0.0`, the maximum of the minimum Node versions in the dependency tree, not the spec's original `>=20.12`. Checked the `engines` of every package in the lockfile: direct deps need little (`@nestjs/core` >=20, `@nestjs/cli` >=20.11, `next` >=20.9, `react` any; `@mikro-orm/core` not installed yet), but `concurrently` 10 and Nest's prod dep `file-type` need >=22, `@nestjs/schematics` >=22.12, and Nest CLI's `@angular-devkit/*` need `^22.22.3 || ^24.15.0 || >=26.0.0`, which is the strictest and covers the rest. Alternatives: `>=20.12` (understates what the tree needs; npm prints `EBADENGINE`), `>=22.22.3` (wrongly allows 24.0-24.14). Updated in spec 1, spec 6 (README prerequisites), the overview and `AGENTS.md`. Local Node 24.4.0 is below the range: npm only warns (`engine-strict` is off) and all checks pass, but it should be upgraded to 24.15+.
- Biome ignores `.claude/` and `context/` (`files.includes`), so harness files keep their own formatting.

Verified: Testing steps 1-5 all pass (step 4: `postgres:18-alpine` is `healthy`).

Testing steps (review checks against these):

1. Delete `packages/shared/dist`, run `npm install`: `dist/index.js` and `dist/index.d.ts` appear again
2. `npm run lint`, `npm run typecheck`, `npm test` pass from the root (shared tests run, api and web pass with no tests)
3. Add an unused import and an unused local in api and web: `npm run lint` and `npm run typecheck` fail. Revert
4. `docker compose up -d`, then `docker compose ps`: postgres is `healthy`
5. `npm run dev`: web answers on http://localhost:3000, api listens on 4000 (`curl -i http://localhost:4000` gives 404, not connection refused)

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
