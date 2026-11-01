@AGENTS.md

# Mini Wine Cellar

A small full-stack app where each user keeps a personal list of wine bottles, adds new ones and likes the ones they enjoy. Repo: npm workspaces monorepo with a NestJS API (`apps/api`), a Next.js web app (`apps/web`) and shared validation limits (`packages/shared`).

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

Run everything from the repo root. `packages/shared` is built automatically (`prepare` after `npm install`, plus `predev`, `pretypecheck`, `pretest`; `npm run build` builds it first through the workspace order); build it by hand only when running a single workspace script: `npm run build:shared`.

- **Dev (both apps)**: `npm run dev` (`concurrently`: api on 4000, web on 3000)
- **Dev (one app)**: `npm run start:dev -w api` / `npm run dev -w web`
- **Build**: `npm run build`
- **Lint**: `npm run lint` (Biome, root only; workspaces have no lint script)
- **Format**: `npm run format` (Biome `check --write`, root only)
- **Typecheck**: `npm run typecheck` (each workspace runs its own `tsc`; web runs `next typegen` first)
- **Test**: `npm test` (Jest in every workspace; api `src/**/*.spec.ts`, web and shared `src/**/*.test.ts`)
- **Test (one workspace)**: `npm test -w api` / `npm test -w web` / `npm test -w @mini-wine-cellar/shared`; watch: `npm run test:watch -w api`
- **Codegen (web)**: `npm run codegen -w web` (reads `apps/api/schema.gql`, writes `apps/web/src/gql/`; rerun after the api schema changes)
- **DB**: `docker compose up -d` (Postgres 18 on 5432), `docker compose ps` for health; MikroORM migrations come in spec 2
