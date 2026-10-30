@AGENTS.md

# Mini Wine Cellar

TODO: one-line product description (comes from `context/project-spec.md`). Repo: npm workspaces monorepo with a NestJS API (`apps/api`) and a Next.js web app (`apps/web`).

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

The root `package.json` has no working scripts yet. Run everything from the repo root and target a workspace with `-w web` or `-w api`. Spec 1 adds root workspace scripts (`dev`, `test`, `lint`, `typecheck`) and a single root Biome; update this list when that lands.

- **Dev server (web)**: `npm run dev -w web` (Next.js, port 3000)
- **Dev server (api)**: `npm run start:dev -w api` (currently `PORT` env, default 3000; spec 1 moves it to 4000, GraphQL at `/graphql`)
- **Build**: `npm run build -w web` / `npm run build -w api`
- **Lint**: `npm run lint -w web` (Biome) / `npm run lint -w api` (oxlint)
- **Format**: `npm run format -w web` (Biome) / `npm run format -w api` (Prettier)
- **Typecheck (web)**: `npm exec -w web -- next typegen` then `npm exec -w web -- tsc --noEmit` (route types such as `LayoutProps` exist only after typegen, dev or build)
- **Typecheck (api)**: `npm exec -w api -- tsc --noEmit`
- **Test (api, once)**: `npm test -w api` (Jest, unit `src/**/*.spec.ts`)
- **Test (api, watch)**: `npm run test:watch -w api`
- **Test (api, e2e)**: `npm run test:e2e -w api` (`test/*.e2e-spec.ts`, supertest)
- **Test (web)**: none yet; spec 1 adds Jest via `next/jest`
- **DB**: none yet; spec 1 adds PostgreSQL (docker-compose) and MikroORM migrations
