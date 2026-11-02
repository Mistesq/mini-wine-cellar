# Current Feature: UI Polish Phase 1 (Spec 7)

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

Complete

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

- [x] Demo data in `apps/api/src/seeders/demo-bottles.ts`: 5-6 bottles for Anna with fixed uuids, different vintages (across decades), regions (several countries) and `likesCount` (0 to 5), explicit past `createdAt` per bottle so the order is fixed and UI-added bottles land on top
- [x] Photos only from Unsplash (`images.unsplash.com`) or Wikimedia Commons (`upload.wikimedia.org`, PD / CC0 / CC BY / CC BY-SA), source page + license (+ author when required) next to each URL; every URL https with a TLD, no credentials, max 2048; one bottle without a photo
- [x] `DatabaseSeeder` upserts the demo bottles by `id` (merge, `likesCount` included): a reseed creates no duplicates, resets demo bottles to seed values, never touches UI-added bottles; Mark and Taras stay empty
- [x] `demo-bottles.spec.ts`: every demo entry passes `AddBottleInput` validation (class-validator)
- [x] D-29 in `docs/decisions.md`: demo bottles in the seed, fixed ids with upsert, Anna only, photo sources and licenses, reseed resets demo likes (canonical demo state), UI-added bottles untouched
- [x] Card: vintage as shadcn `Badge`, region with `MapPinIcon` (`aria-hidden`), producer under the name
- [x] Like button: heart + count with a short pop animation on every click (rapid clicks re-trigger it), none under `prefers-reduced-motion: reduce`; optimistic count, rollback and inline error unchanged
- [x] Sonner: one `<Toaster />` in `providers.tsx`, `toast.success("Bottle added")` only after a successful `addBottle`; no error toasts
- [x] Header: `WineIcon` (`aria-hidden`) next to the app name
- [x] Favicon `apps/web/src/app/icon.svg` (wine glass in the `--primary` color as a literal); scaffold `favicon.ico` deleted
- [x] `metadata`: title "Mini Wine Cellar", description matching the product (personal list, add and like)
- [x] Loading state: skeleton cards (shadcn `Skeleton`) in the card grid and shape, with an accessible loading hint
- [x] Error state: "Try again" button calling `refetch()`, disabled or busy while it runs; cached bottles stay visible on a failed refetch
- [x] After every `shadcn add` / install: `npm run format`, `npm ls --all` clean except the known `ajv-formats`; peers added by hand (legacy-peer-deps)
- [x] `AGENTS.md` records the new packages and versions; `context/project-overview.md` UI / UX mentions the toast, card details and demo data

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

Spec: `context/features/ui-polish-spec.md`. Branch `spec/7-ui-polish` from `feat/wine-cellar`. Runs before spec 6 (delivery).

Gotchas:

- Context7 for the installed shadcn CLI, Sonner, lucide-react, Tailwind CSS 4 and MikroORM 6 versions.
- MikroORM 6 `upsertMany`: `onConflictFields` / `onConflictAction` / `onConflictMergeFields`; conflict on `id`, merge including `likesCount`.
- `createdAt` defaults to `now()` in the database: pass explicit dates, otherwise one insert gives all demo rows the same timestamp.
- `curl -sI` every photo URL before committing: 200 and `image/*`. Prefer sized Unsplash URLs (`?w=800&q=80`).
- shadcn `sonner.tsx` may import `useTheme` from `next-themes`: drop it and pass `theme="light"` instead of adding the dependency.
- lucide-react 1.66 icon names use the `Icon` suffix (`HeartIcon`, `MapPinIcon`, `WineIcon`).
- Like animation restarts on every click (bump a `key` on the icon or restart the class); keyframes in `globals.css` (`@theme --animate-*`) or `tw-animate-css`.
- SVG favicon cannot read CSS variables: write `oklch(0.42 0.15 15)` (or its hex) as a literal.
- Apollo Client 4: check how `useQuery` reports refetch progress (`notifyOnNetworkStatusChange`, `networkStatus`) before wiring the retry busy state.

Out of scope: the spec's Optional items (fade-in for new cards); error toasts; demo bottles for Mark or Taras; README, video and PR (spec 6).

Testing (from the spec):

1. `npm run db:seed` twice: Anna has the demo bottles once, no duplicates; a bottle added through the UI before the second seed is still there and on top; a demo bottle liked before the second seed is back to its seed count
2. As Anna: cards show photo (or placeholder), name, producer, vintage badge, region with pin icon, like count; all photos load
3. Rapid likes: heart pops on every click, count goes up at once; reduced motion emulated: no animation
4. Valid add: "Bottle added" toast, bottle on top. Empty submit: field errors, no toast
5. Mark and Taras: empty state
6. Slow network: skeleton cards. Api stopped + reload: error with "Try again"; api started + click: list loads
7. Tab shows the wine-glass favicon and title "Mini Wine Cellar"; page source has the description meta
8. Playwright MCP screenshots at 375x812 and 1280x800 (Anna with the list, Mark empty, form with errors), shown to the user in chat before `/feature complete`, not committed
9. `npm run lint && npm run typecheck && npm test && npm run build` green; `npm ls --all` clean apart from `ajv-formats`

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
- Spec 2, API Phase 1: api downgraded to Nest 11.2 + MikroORM 6.6 (Nest 12 / MikroORM 7 are ESM-only and break CJS Jest), engines `^22.13.0 || >=24.0.0`; one `mikro-orm.config.ts` for Nest and the CLI (ts-node, `DATABASE_URL` fallback outside production); `User` and `Bottle` entities, ascending `(owner_id, created_at, id)` index scanned backwards, `created_at` set by the database; initial migration with a hand-written `down`; seeder with fixed uuids; `UsersService` and `BottlesService` (atomic owner-scoped `like`, `NotFoundException` for foreign or missing); `db:migrate` / `db:seed` scripts; `BottlesService` unit tests; decisions D-14 to D-18
- Spec 3, API Phase 2: Apollo GraphQL at `/graphql` (`@nestjs/graphql` / `@nestjs/apollo` 13, Apollo Server 5 via `@as-integrations/express5`, graphql 16), `schema.gql` written outside production; `UserIdGuard` on `x-user-id` with `@CurrentUser()` and unit tests; `UsersResolver.users` public, guarded `BottlesResolver` (`myBottles`, `addBottle`, `likeBottle`); `AddBottleInput` with shared limits, trimming, empty photoUrl as absent, https without credentials, vintage max per validation; CORS and global `ValidationPipe` with per-field messages; `formatError` as the only error mapper; root `.npmrc` `legacy-peer-deps`, api lockfile subtree re-resolved, `@graphql-tools/utils` override; decisions D-19 to D-25
- Spec 4, Web Phase 1: shadcn/ui on Radix (`radix-nova`, components import the `cn` package), light theme with wine-red `--primary` and neutral `--accent`; GraphQL Codegen client preset from `apps/api/schema.gql` into committed `src/gql/`; Apollo Client 4 per `Providers` mount with a `SetContextLink` that adds `x-user-id` at request time; `current-user-store` over `localStorage` via `useSyncExternalStore` (server snapshot `null`, cross-tab `storage` incl. `clear()`, memory fallback when storage is blocked); `resetStore` on every user switch; header user picker with loading and error states; `/` prompt or name placeholder; `NEXT_PUBLIC_API_URL` localhost fallback outside production, production build fails without it; graphql 16 shared with the api; unit tests for `resolveApiUrl` and the store; decisions D-26, D-27
- Spec 5, Web Phase 2: `addBottleSchema` (Zod 4) with shared limits, year read at validation time, photoUrl mirroring the api (https only, no credentials, dotted hostname, max 2048); `AddBottleForm` on react-hook-form + `zodResolver` with server `BAD_USER_INPUT` fields mapped through `setError` (focus on the first) and an alert only for other errors; `addBottle` prepends to the cached `myBottles`; `BottleList` loading / empty / error states keeping cached bottles on a failed refetch; `BottleCard` with a 4:3 photo and placeholder; `LikeButton` with an `optimisticResponse` built from the cached count so clicks stack, rollback on error; responsive cellar layout, form keyed by user; GraphQL documents in `src/graphql`, codegen `nonOptionalTypename`; tests for the schema, field error mapping and `optimisticLike`; decision D-28
