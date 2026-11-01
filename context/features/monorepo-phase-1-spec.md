# Monorepo Phase 1 - Tooling, Shared Package and Postgres

## Overview

Spec 1 (`spec/1-setup-monorepo`). Turns the two scaffolds into one monorepo: scaffold boilerplate removed, one root Biome, strict TypeScript, root scripts, Jest in every workspace, `packages/shared` with the validation limits, and Postgres in docker-compose. No product features yet.

## Requirements

- Remove scaffold boilerplate: api `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`, `test/` (e2e test, `jest-e2e.json`, `test:e2e` script), `deploy` script and `@nestjs/mau`; web demo `page.tsx` content (replace with a minimal heading) and `public/*.svg`; both scaffold `README.md` files. `AppModule` stays, empty. API default port becomes 4000 (`PORT` env). The api reads only `PORT` in this spec; `.env` loading (`process.loadEnvFile`) comes in spec 2.
- One `biome.json` at the root for all workspaces. Delete `apps/web/biome.json`, `apps/api/oxlint.json`, `apps/api/.prettierrc`, and the oxlint and Prettier dependencies and scripts. Workspaces have no `lint` or `format` scripts; both run only from the root. Rules: `recommended`, plus `noExplicitAny`, `noUnusedImports`, `noUnusedVariables` as `error`. The `next` and `react` domains apply only to `apps/web` (overrides). Reformat the api once with Biome.
- Strict flags in each workspace's own tsconfig (api, web, shared), not in a shared base: `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Each app keeps its own TypeScript major.
- `packages/shared` (`@mini-wine-cellar/shared`): `BOTTLE_LIMITS` (text 1-100, photoUrl max 2048, vintage min 1900) and `getMaxVintage(now?)` returning the current UTC year. No runtime deps. Built with its own `tsc` to CommonJS + `.d.ts` in `dist/`, exposed through `exports`.
- The shared build runs automatically: root `prepare` (after `npm install`) and `predev`, `prebuild`, `pretest`, `pretypecheck`. Nobody builds it by hand.
- Root `package.json`: `"engines": { "node": ">=20.12" }` (`process.loadEnvFile` needs 20.12, Next 16 needs 20.9+). Scripts: `dev` (api and web in parallel via `concurrently`), `build`, `lint` (`biome check .`), `format` (`biome check --write .`), `typecheck`, `test`. `typecheck` and `test` run through `--workspaces --if-present`; each workspace has its own `typecheck` (web: `next typegen && tsc --noEmit`).
- Jest everywhere: web via `next/jest` (node environment, co-located `*.test.ts`), shared via ts-jest with a test for `BOTTLE_LIMITS` and `getMaxVintage`. The api keeps its Jest config. api and web have no tests yet, so their `test` scripts get `--passWithNoTests` temporarily (removed in spec 2 for api, in spec 5 for web).
- `docker-compose.yml` with Postgres (pinned to the latest stable major that the installed MikroORM supports, named volume mounted at `/var/lib/postgresql`, healthcheck, port 5432). `apps/api/.env.example` and `apps/web/.env.example`. Allow `docker compose` and the MikroORM CLI in `.claude/settings.json`. Update the Commands in `CLAUDE.md` and the versions in `AGENTS.md`.

## Files to Create / Change

1. `package.json` (root) - `engines`, scripts, workspace order `packages/*` first, root devDeps (Biome, `concurrently`)
2. `biome.json` (root) - the single lint/format config
3. `apps/api/tsconfig.json`, `apps/web/tsconfig.json` - strict flags
4. `packages/shared/{package.json,tsconfig.json,src/index.ts,src/limits.test.ts,jest.config.*}`
5. `apps/web/jest.config.ts` - `next/jest`
6. `docker-compose.yml`, `apps/api/.env.example`, `apps/web/.env.example`
7. `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/web/src/app/page.tsx` - boilerplate removed
8. `.claude/settings.json`, `CLAUDE.md`, `AGENTS.md`

## Notes

Use Context7 or the installed docs for Biome 2.4, `next/jest` (`node_modules/next/dist/docs/`) and npm workspaces.

- `npm run dev --workspaces` runs workspaces one after another and blocks on the first server, so `dev` uses `concurrently` (approved, root devDependency) with named, colored output.
- Biome and Nest: `useImportType` must not turn DI-injected classes into `import type` (it breaks `emitDecoratorMetadata`); turn it off for `apps/api` if it fires. Check that parameter decorators (`@Args()`) parse.
- `shared` uses `module: nodenext` without `"type": "module"`, so it emits CommonJS that both the Nest app and Next.js import.
- `--workspaces` runs in the order of the `workspaces` array, so list `packages/*` first.
- Check that `next typegen` output still passes with `noUnusedLocals` / `noUnusedParameters`.
- Compose credentials are local dev defaults read from env with fallbacks; real `.env` files stay gitignored.

## Environment Variables

```
# apps/api/.env
PORT=
DATABASE_URL=
CORS_ORIGIN=
# apps/web/.env.local
NEXT_PUBLIC_API_URL=
```

## Testing

1. Delete `packages/shared/dist`, run `npm install`: `dist/index.js` and `dist/index.d.ts` appear again
2. `npm run lint`, `npm run typecheck`, `npm test` pass from the root (shared tests run, api and web pass with no tests)
3. Add an unused import and an unused local in api and web: `npm run lint` and `npm run typecheck` fail. Revert
4. `docker compose up -d`, then `docker compose ps`: postgres is `healthy`
5. `npm run dev`: web answers on http://localhost:3000, api listens on 4000 (`curl -i http://localhost:4000` gives 404, not connection refused)

## References

- Biome configuration: https://biomejs.dev/reference/configuration/
- Biome rules: https://biomejs.dev/linter/rules/no-unused-imports/
- tsconfig flags: https://www.typescriptlang.org/tsconfig/#noUnusedLocals
- npm workspaces and lifecycle scripts: https://docs.npmjs.com/cli/v10/using-npm/workspaces, https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts
- Next.js Jest: https://nextjs.org/docs/app/guides/testing/jest
- Postgres image: https://hub.docker.com/_/postgres
