# Current Feature: Web Phase 1 - Apollo Client, Codegen and User Picker

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

- [x] shadcn/ui initialized for Tailwind v4 (`components.json`, `src/lib/utils.ts`) with Button, Input, Label, Card, Select in `src/components/ui`, formatted by root Biome
- [x] Light theme, neutral palette with a wine-red accent token in `globals.css`
- [x] GraphQL Codegen client preset in `apps/web/codegen.ts`: schema from `../api/schema.gql` (file, not server), documents `src/**/*.{ts,tsx}`, output `src/gql/` (committed, excluded from Biome), `codegen` script in web
- [x] `src/lib/apollo-client.ts`: Apollo Client created once on the client (inside a `"use client"` provider, not a module singleton), `HttpLink` to `NEXT_PUBLIC_API_URL`, a link that adds `x-user-id` from the stored user at request time and sends nothing without a user
- [x] `src/lib/current-user-store.ts`: store over `localStorage` read through `useSyncExternalStore` (server snapshot `null`), SSR and hydration match; switching users clears the Apollo store
- [x] `src/components/providers.tsx` wraps the app with the Apollo provider
- [x] `src/components/app-header.tsx` + `user-picker.tsx`: app name and a user Select filled by the `users` query, with loading and error states; the choice survives a reload
- [x] `/` shows "Choose a user to open the cellar" without a user, otherwise a placeholder with the user's name; mobile-first layout shell (header, main container) in `layout.tsx` / `page.tsx`

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

Spec: `context/features/web-phase-1-spec.md`. Branch: `spec/4-web-foundation` from `feat/wine-cellar`.

**Before writing code**

- Read `apps/web/AGENTS.md` and `node_modules/next/dist/docs/`. Check the installed Apollo Client, Codegen and shadcn versions with Context7 and record them in `AGENTS.md`.
- Apollo Client 4: React hooks and provider live in `@apollo/client/react`, `rxjs` is a peer, the context link is `SetContextLink`. Verify before writing links.
- Root `.npmrc` has `legacy-peer-deps=true`: npm does not install peers, so add every peer (`graphql`, `rxjs`, ...) to `apps/web/package.json` by hand.

**Constraints and gotchas**

- No `@apollo/client-integration-nextjs`: the cellar is client-rendered (A7).
- Client preset `graphql()` returns `TypedDocumentNode`; hooks infer types, no manual generics.
- shadcn writes kebab-case files under `src/components/ui`; run `npm run format` so root Biome passes.
- Never read `localStorage` during render or in module scope (no `window` on the server).
- Env: `NEXT_PUBLIC_API_URL` (`apps/web/.env.example` = `http://localhost:4000/graphql`).
- GraphQL contract used here: `query users: [User!]!` (public). `myBottles` / `addBottle` / `likeBottle` come in spec 5.

**Out of scope**

- The cellar itself (form, list, like) is spec 5.
- Optional items (`auth-headers.ts` + test, resetting a stored id that is not in `users`) are skipped unless asked.

**Testing steps (review checks against these)**

1. `npm run codegen -w web` regenerates `src/gql` with no diff
2. With the api running, open http://localhost:3000: the header lists Anna, Mark, Taras
3. Pick Mark and reload: Mark stays selected; DevTools Network shows `x-user-id` on GraphQL requests
4. Stop the api and reload: the picker shows an error state, the page does not crash
5. Check widths of 375px and 1280px: the header fits, no horizontal scroll
6. `npm test`, `npm run typecheck`, `npm run lint` pass; no hydration warnings in the console

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
- Spec 2, API Phase 1: api downgraded to Nest 11.2 + MikroORM 6.6 (Nest 12 / MikroORM 7 are ESM-only and break CJS Jest), engines `^22.13.0 || >=24.0.0`; one `mikro-orm.config.ts` for Nest and the CLI (ts-node, `DATABASE_URL` fallback outside production); `User` and `Bottle` entities, ascending `(owner_id, created_at, id)` index scanned backwards, `created_at` set by the database; initial migration with a hand-written `down`; seeder with fixed uuids; `UsersService` and `BottlesService` (atomic owner-scoped `like`, `NotFoundException` for foreign or missing); `db:migrate` / `db:seed` scripts; `BottlesService` unit tests; decisions D-14 to D-18
- Spec 3, API Phase 2: Apollo GraphQL at `/graphql` (`@nestjs/graphql` / `@nestjs/apollo` 13, Apollo Server 5 via `@as-integrations/express5`, graphql 16), `schema.gql` written outside production; `UserIdGuard` on `x-user-id` with `@CurrentUser()` and unit tests; `UsersResolver.users` public, guarded `BottlesResolver` (`myBottles`, `addBottle`, `likeBottle`); `AddBottleInput` with shared limits, trimming, empty photoUrl as absent, https without credentials, vintage max per validation; CORS and global `ValidationPipe` with per-field messages; `formatError` as the only error mapper; root `.npmrc` `legacy-peer-deps`, api lockfile subtree re-resolved, `@graphql-tools/utils` override; decisions D-19 to D-25
