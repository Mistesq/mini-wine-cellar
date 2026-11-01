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
- Spec 3, API Phase 2: Apollo GraphQL at `/graphql` (`@nestjs/graphql` / `@nestjs/apollo` 13, Apollo Server 5 via `@as-integrations/express5`, graphql 16), `schema.gql` written outside production; `UserIdGuard` on `x-user-id` with `@CurrentUser()` and unit tests; `UsersResolver.users` public, guarded `BottlesResolver` (`myBottles`, `addBottle`, `likeBottle`); `AddBottleInput` with shared limits, trimming, empty photoUrl as absent, https without credentials, vintage max per validation; CORS and global `ValidationPipe` with per-field messages; `formatError` as the only error mapper; root `.npmrc` `legacy-peer-deps`, api lockfile subtree re-resolved, `@graphql-tools/utils` override; decisions D-19 to D-25
- Spec 4, Web Phase 1: shadcn/ui on Radix (`radix-nova`, components import the `cn` package), light theme with wine-red `--primary` and neutral `--accent`; GraphQL Codegen client preset from `apps/api/schema.gql` into committed `src/gql/`; Apollo Client 4 per `Providers` mount with a `SetContextLink` that adds `x-user-id` at request time; `current-user-store` over `localStorage` via `useSyncExternalStore` (server snapshot `null`, cross-tab `storage` incl. `clear()`, memory fallback when storage is blocked); `resetStore` on every user switch; header user picker with loading and error states; `/` prompt or name placeholder; `NEXT_PUBLIC_API_URL` localhost fallback outside production, production build fails without it; graphql 16 shared with the api; unit tests for `resolveApiUrl` and the store; decisions D-26, D-27
- Spec 5, Web Phase 2: `addBottleSchema` (Zod 4) with shared limits, year read at validation time, photoUrl mirroring the api (https only, no credentials, dotted hostname, max 2048); `AddBottleForm` on react-hook-form + `zodResolver` with server `BAD_USER_INPUT` fields mapped through `setError` (focus on the first) and an alert only for other errors; `addBottle` prepends to the cached `myBottles`; `BottleList` loading / empty / error states keeping cached bottles on a failed refetch; `BottleCard` with a 4:3 photo and placeholder; `LikeButton` with an `optimisticResponse` built from the cached count so clicks stack, rollback on error; responsive cellar layout, form keyed by user; GraphQL documents in `src/graphql`, codegen `nonOptionalTypename`; tests for the schema, field error mapping and `optimisticLike`; decision D-28
