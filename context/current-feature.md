# Current Feature: Web Phase 2 - Cellar: Add Form, List and Optimistic Like

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

- [x] `src/lib/add-bottle-schema.ts`: Zod `addBottleSchema` with limits from `@mini-wine-cellar/shared`, clear messages ("Name is required", "Vintage must be between 1900 and <current year>", "Photo URL must start with https://"), trimmed strings, empty photoUrl -> `undefined`, max vintage from `getMaxVintage()` at validation time
- [x] `src/graphql/bottles.ts`: `myBottles`, `addBottle`, `likeBottle` documents; `npm run codegen -w web` regenerated
- [x] `AddBottleForm`: react-hook-form + `zodResolver`, errors under each field (on submit, then on change), submit disabled while sending, server errors in an inline alert, reset on success
- [x] `addBottle` prepends the new bottle to the cached `myBottles`, no refetch
- [x] `BottleList`: `myBottles` with loading ("Loading..."), empty ("Your cellar is empty") and error (message) states
- [x] `BottleCard`: fixed-aspect photo with a placeholder for a missing or broken URL; name, producer, vintage, region, like count
- [x] `LikeButton`: `likeBottle` with `optimisticResponse` (`likesCount + 1`), Apollo rolls back on error and the card shows it; no toggle, rapid clicks each count
- [x] Layout in `page.tsx`: 375px one column with the form above the list and 44px tap targets; 1280px form in a side column, list as a card grid
- [x] Jest tests for `addBottleSchema`: valid input, each field invalid, vintage bounds, https only, trimming, empty photoUrl
- [x] Server parity: `addBottleSchema` also rejects a photoUrl with credentials (`https://user:pass@...`), like the api's `disallow_auth`, with a message under the field
- [x] Server validation errors: a `BAD_USER_INPUT` with `extensions.fields` is mapped onto the form fields through react-hook-form `setError`; the inline alert only shows errors without `fields`
- [x] Web `test` script without `--passWithNoTests`
- [x] `"@mini-wine-cellar/shared": "*"` declared in web `dependencies`

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

Spec: `context/features/web-phase-2-spec.md`. Branch: `spec/5-web-cellar` from `feat/wine-cellar`.

**Before writing code**

- Context7 for the installed Zod, react-hook-form and `@hookform/resolvers` versions; record them in `AGENTS.md`. Registry now: zod 4.6.7 (already in the tree through the shadcn CLI), react-hook-form 7.91.0, `@hookform/resolvers` 7.0.1 (peers all optional: `zod ^3.25 || ^4`, `react-hook-form ^7.55`; dependency `@standard-schema/utils`).
- `.npmrc` `legacy-peer-deps`: after each install run `npm ls --all` and declare missing peers by hand.

**Constraints and gotchas**

- Zod 4: messages via `{ error: "..." }`, URL via top-level `z.url()` with a protocol option.
- Never `.max(getMaxVintage())` at module load: check the vintage in `refine` / a function so the year is read at validation time.
- Number input: `valueAsNumber` or coerce so the schema input/output types line up with `useForm`.
- Optimistic response matches the mutation selection exactly (`__typename`, `id`, `likesCount`).
- Plain `<img>` (A11): `// biome-ignore lint/performance/noImgElement: photos come from arbitrary domains` on that element only; verify the rule group in Biome 2.4.
- Apollo Client 4 hooks from `@apollo/client/react`.
- API contract (`apps/api/schema.gql`): `myBottles: [Bottle!]!` (newest first), `addBottle(input: AddBottleInput!): Bottle!` (`name`, `producer`, `region`, `vintage: Int!`, `photoUrl?`), `likeBottle(id: ID!): Bottle!`; `Bottle` = `id`, `name`, `producer`, `region`, `vintage`, `photoUrl`, `likesCount`, `createdAt: DateTime`. Errors: `UNAUTHENTICATED`, `BAD_USER_INPUT` (`extensions.fields`), `NOT_FOUND`.
- The api's `AddBottleInput` (D-24) also rejects a photo URL with `user:pass@` and longer than 2048 chars.
- Spec 4 context: `Providers` calls `resetStore` on a user switch (D-27); `src/components/cellar.tsx` is the user gate and gets the form and list; the users query moved from `src/lib/users-query.ts` to `src/graphql/users.ts` in this spec.

**Out of scope**

- Optional items (skeleton cards, retry button) are skipped unless asked.
- No edit or delete (A8), no pagination.

**Testing steps (review checks against these)**

1. As Anna, submit an empty form: messages appear under name, producer, vintage, region
2. Enter vintage 1800 and photo `http://x.com/a.jpg`: the vintage-range and https messages appear
3. Add a valid bottle: it appears at the top with no reload and the form resets; Network shows no `myBottles` refetch
4. Click like 3 times quickly: the count goes up on every click at once; after a reload it stays the same
5. Stop the api and click like: the count rolls back and the card shows an error
6. Switch to Mark: Anna's bottles are gone, the empty state shows
7. Check 375px and 1280px: no horizontal scroll, the grid and the side form at desktop width
8. `npm test`, `npm run typecheck`, `npm run lint` pass

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
- Spec 2, API Phase 1: api downgraded to Nest 11.2 + MikroORM 6.6 (Nest 12 / MikroORM 7 are ESM-only and break CJS Jest), engines `^22.13.0 || >=24.0.0`; one `mikro-orm.config.ts` for Nest and the CLI (ts-node, `DATABASE_URL` fallback outside production); `User` and `Bottle` entities, ascending `(owner_id, created_at, id)` index scanned backwards, `created_at` set by the database; initial migration with a hand-written `down`; seeder with fixed uuids; `UsersService` and `BottlesService` (atomic owner-scoped `like`, `NotFoundException` for foreign or missing); `db:migrate` / `db:seed` scripts; `BottlesService` unit tests; decisions D-14 to D-18
- Spec 3, API Phase 2: Apollo GraphQL at `/graphql` (`@nestjs/graphql` / `@nestjs/apollo` 13, Apollo Server 5 via `@as-integrations/express5`, graphql 16), `schema.gql` written outside production; `UserIdGuard` on `x-user-id` with `@CurrentUser()` and unit tests; `UsersResolver.users` public, guarded `BottlesResolver` (`myBottles`, `addBottle`, `likeBottle`); `AddBottleInput` with shared limits, trimming, empty photoUrl as absent, https without credentials, vintage max per validation; CORS and global `ValidationPipe` with per-field messages; `formatError` as the only error mapper; root `.npmrc` `legacy-peer-deps`, api lockfile subtree re-resolved, `@graphql-tools/utils` override; decisions D-19 to D-25
- Spec 4, Web Phase 1: shadcn/ui on Radix (`radix-nova`, components import the `cn` package), light theme with wine-red `--primary` and neutral `--accent`; GraphQL Codegen client preset from `apps/api/schema.gql` into committed `src/gql/`; Apollo Client 4 per `Providers` mount with a `SetContextLink` that adds `x-user-id` at request time; `current-user-store` over `localStorage` via `useSyncExternalStore` (server snapshot `null`, cross-tab `storage` incl. `clear()`, memory fallback when storage is blocked); `resetStore` on every user switch; header user picker with loading and error states; `/` prompt or name placeholder; `NEXT_PUBLIC_API_URL` localhost fallback outside production, production build fails without it; graphql 16 shared with the api; unit tests for `resolveApiUrl` and the store; decisions D-26, D-27
