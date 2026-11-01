# API Phase 1 - MikroORM Data Layer

## Overview

Spec 2 (`spec/2-api-data`). Adds PostgreSQL access through MikroORM: User and Bottle entities, the first migration, a seeder with 3 users, and the services that hold all ownership rules. No GraphQL yet.

## Requirements

- Install MikroORM for Postgres with `@mikro-orm/nestjs`, `@mikro-orm/migrations`, `@mikro-orm/seeder` and the CLI. Record the versions in `AGENTS.md`.
- One `mikro-orm.config.ts` used by both the Nest app (`MikroOrmModule.forRoot`) and the CLI. Connection from `DATABASE_URL`. Request context on, so every request gets its own `EntityManager`.
- Entities per the overview Data Model: `User` (`id` uuid, `name` unique) and `Bottle` (`owner` ManyToOne, `name`, `producer`, `region`, `vintage` int, `photoUrl` nullable, `likesCount` default 0, `createdAt` timestamptz default now). Index `(owner_id, created_at DESC, id DESC)`.
- The first migration is generated from the entities and committed. Schema changes only through migrations (no `schema:update`).
- `DatabaseSeeder` upserts Anna, Mark and Taras with fixed uuids, so reseeding keeps the ids stable.
- `UsersService`: `findAll()` (ordered by name) and `findById(id)`. `BottlesService`: `findForOwner(ownerId)` ordered `createdAt DESC, id DESC`; `create(ownerId, data)` with the owner taken only from the argument; `like(ownerId, id)` with a single conditional atomic increment, throwing `NotFoundException` when no row matches.
- Root scripts `db:migrate` and `db:seed` (plus `migration:create` in api) delegate to the MikroORM CLI.
- Unit tests for `BottlesService` with a mocked `EntityManager`, no real database.
- Remove the temporary `--passWithNoTests` from the api `test` script (added in spec 1), now that `BottlesService` has tests.

## Files to Create

1. `apps/api/src/mikro-orm.config.ts`
2. `apps/api/src/users/{user.entity.ts,users.module.ts,users.service.ts}`
3. `apps/api/src/bottles/{bottle.entity.ts,bottles.module.ts,bottles.service.ts,bottles.service.spec.ts}`
4. `apps/api/src/migrations/Migration<timestamp>.ts` (generated)
5. `apps/api/src/seeders/database.seeder.ts`
6. `apps/api/src/app.module.ts` - register `MikroOrmModule`, `UsersModule`, `BottlesModule`

## Notes

Use Context7 for the installed MikroORM major before writing entities. In v7 the decorators live in a separate package (`@mikro-orm/decorators`), and the CLI and config loading changed.

- `likeBottle` is one statement: `UPDATE bottle SET likes_count = likes_count + 1 WHERE id = ? AND owner_id = ?`. No read-then-write. A bottle of another user and a missing id both throw the same `NotFoundException`.
- A native update bypasses the identity map: re-read the row with `refresh` (or use `RETURNING`) before returning it.
- With the reflect-metadata provider, nullable or union types need an explicit `type` / `nullable: true`.
- A DESC composite index may need an `expression` index. Afterwards `migration:check` must report no pending changes.
- `noImplicitOverride` is on: the generated migration (`up`/`down`) and the seeder's `run` need `override`.
- The CLI must load `mikro-orm.config.ts` under TypeScript 6 (ts-node is installed; check that it works). Env loading: `process.loadEnvFile()` (Node 20.12+, matches `engines`) with no new dependency; it must not crash when `.env` is missing.

## Environment Variables

```
DATABASE_URL=
```

## Testing

1. `docker compose up -d`, then `npm run db:migrate`: tables `user` and `bottle` exist (`docker compose exec postgres psql -U <user> -d <db> -c '\d bottle'` shows the index and defaults)
2. `npm run db:seed` twice: `select id, name from "user"` returns exactly Anna, Mark, Taras with the same ids
3. `npm exec -w api -- mikro-orm migration:check`: no changes
4. `npm test -w api`: `BottlesService` covers order and owner filter, owner from the argument on create, increment on like, `NotFoundException` for a foreign or missing bottle
5. `npm run typecheck` and `npm run lint` pass

## References

- MikroORM with NestJS: https://mikro-orm.io/docs/usage-with-nestjs
- Migrations: https://mikro-orm.io/docs/migrations
- Seeding: https://mikro-orm.io/docs/seeding
- Native update / query builder: https://mikro-orm.io/docs/query-builder
- Nest testing: https://docs.nestjs.com/fundamentals/testing
