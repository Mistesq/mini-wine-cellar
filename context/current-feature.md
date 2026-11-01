# Current Feature

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

Not Started

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
- Spec 2, API Phase 1: api downgraded to Nest 11.2 + MikroORM 6.6 (Nest 12 / MikroORM 7 are ESM-only and break CJS Jest), engines `^22.13.0 || >=24.0.0`; one `mikro-orm.config.ts` for Nest and the CLI (ts-node, `DATABASE_URL` fallback outside production); `User` and `Bottle` entities, ascending `(owner_id, created_at, id)` index scanned backwards, `created_at` set by the database; initial migration with a hand-written `down`; seeder with fixed uuids; `UsersService` and `BottlesService` (atomic owner-scoped `like`, `NotFoundException` for foreign or missing); `db:migrate` / `db:seed` scripts; `BottlesService` unit tests; decisions D-14 to D-18
