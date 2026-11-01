# Current Feature: API Phase 1 - MikroORM Data Layer

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

- [x] MikroORM for Postgres installed in `apps/api` with `@mikro-orm/nestjs`, `@mikro-orm/migrations`, `@mikro-orm/seeder` and the CLI; versions recorded in `AGENTS.md` (MikroORM 6.6 + Nest 11 after the ESM downgrade, D-15)
- [x] One `apps/api/src/mikro-orm.config.ts` used by both `MikroOrmModule.forRoot` and the CLI; connection from `DATABASE_URL`; request context on (fresh `EntityManager` per request)
- [x] `User` entity: `id` uuid PK, `name` unique
- [x] `Bottle` entity: `owner` ManyToOne, `name`, `producer`, `region`, `vintage` int, `photoUrl` nullable, `likesCount` default 0, `createdAt` timestamptz default now; index on `(owner_id, created_at, id)`, scanned backwards for the DESC order (D-17, plan said a DESC index)
- [x] First migration generated from the entities and committed; no `schema:update`
- [x] `DatabaseSeeder` upserts Anna, Mark, Taras with fixed uuids (reseed keeps ids stable)
- [x] `UsersService`: `findAll()` ordered by name, `findById(id)`
- [x] `BottlesService`: `findForOwner(ownerId)` ordered `createdAt DESC, id DESC`; `create(ownerId, data)` with owner only from the argument; `like(ownerId, id)` as one conditional atomic increment, `NotFoundException` when no row matches
- [x] `UsersModule`, `BottlesModule` and `MikroOrmModule` registered in `app.module.ts`
- [x] Root scripts `db:migrate`, `db:seed` and api `migration:create` delegate to the MikroORM CLI
- [x] `BottlesService` unit tests with a mocked `EntityManager`, no real database
- [x] `--passWithNoTests` removed from the api `test` script

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

### Files

- `apps/api/src/mikro-orm.config.ts`
- `apps/api/src/users/{user.entity.ts,users.module.ts,users.service.ts}`
- `apps/api/src/bottles/{bottle.entity.ts,bottles.module.ts,bottles.service.ts,bottles.service.spec.ts}`
- `apps/api/src/migrations/Migration<timestamp>.ts` (generated)
- `apps/api/src/seeders/database.seeder.ts`
- `apps/api/src/app.module.ts`

### Gotchas

- MikroORM 7 and Nest 12 are ESM-only, so Jest could not load them from CJS tests without `--experimental-vm-modules`. The api moved to Nest 11.2 + MikroORM 6.6 (D-15); decorators come from `@mikro-orm/core` (D-14).
- `like` is one statement: `UPDATE bottle SET likes_count = likes_count + 1 WHERE id = ? AND owner_id = ?`. No read-then-write. A foreign bottle and a missing id throw the same `NotFoundException`.
- A native update bypasses the identity map: re-read with `refresh` (or use `RETURNING`) before returning.
- Reflect-metadata provider: nullable or union types need an explicit `type` / `nullable: true`.
- MikroORM 6 has no per-column index sort without raw SQL; the ascending index serves the DESC order through `Index Scan Backward` (D-17). `migration:check` reports no changes.
- `noImplicitOverride`: generated migration `up`/`down` and the seeder `run` need `override`.
- The CLI must load `mikro-orm.config.ts` under TypeScript 6 (ts-node 10.9.2 works with TS 6 for MikroORM 6). Env via `process.loadEnvFile()`, no new dependency; must not crash when `.env` is missing.
- Env: `DATABASE_URL` is already in `apps/api/.env.example`; without `.env` it falls back to the compose defaults outside production; with `NODE_ENV=production` a missing value fails at start (D-18).
- The initial migration's `down` is hand-written (`--initial` emits none); down/up checked on a fresh database.
- Nest CLI 11 deletes `dist` but not `tsconfig.build.tsbuildinfo`, so a second `nest build` emitted nothing; `tsconfig.build.json` sets `incremental: false`.
- `engines` recalculated to `^22.13.0 || >=24.0.0` (D-16).

### Out of scope

- GraphQL, resolvers, guard, `@CurrentUser()`, class-validator / `ValidationPipe`, `formatError` (spec 3)
- e2e tests against a real database

### Testing

1. `docker compose up -d`, then `npm run db:migrate`: tables `user` and `bottle` exist (`docker compose exec postgres psql -U <user> -d <db> -c '\d bottle'` shows the index and defaults)
2. `npm run db:seed` twice: `select id, name from "user"` returns exactly Anna, Mark, Taras with the same ids
3. `npm exec -w api -- mikro-orm migration:check`: no changes
4. `npm test -w api`: `BottlesService` covers order and owner filter, owner from the argument on create, increment on like, `NotFoundException` for a foreign or missing bottle
5. `npm run typecheck` and `npm run lint` pass

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
