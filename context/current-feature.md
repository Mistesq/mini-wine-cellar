# Current Feature: Delivery Phase 1 - README, Screenshots and Pull Request

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

- [x] Root `README.md`: what the app does (with the like assumption, links to D-1 and D-30), the stack, prerequisites (Node 22.13+ or 24+, `engines` `^22.13.0 || >=24.0.0`, tested on 24 and 26; npm 10+; Docker), run flow `npm install` -> `docker compose up -d` -> `npm run db:migrate` -> `npm run db:seed` -> `npm run dev`, URLs (web 3000, GraphQL 4000/graphql)
- [x] README demo data line: `npm run db:seed` creates demo bottles for Anna; Mark and Taras start empty on purpose (empty state)
- [x] README sections: env files (copy the `.env.example` files), scripts (`lint`, `typecheck`, `test`, `build`, `codegen`, `db:*`), fake login and how ownership is enforced, project layout, link to `docs/decisions.md`
- [x] README build step: copy `apps/web/.env.example` to `apps/web/.env.local` before `npm run build`; the build fails without `NEXT_PUBLIC_API_URL` on purpose (D-26); `npm run dev` needs no env file
- [x] README "Troubleshooting": port 5432 taken; Windows node processes left on 3000/4000 (`netstat -ano | findstr :3000`, `taskkill /PID <pid> /T /F`); `EPERM ... rename .next\dev\...` after `next build` (stop dev, delete `apps/web/.next`, restart)
- [x] README "Photo credits": author, license with link and Commons source page for every CC BY demo photo (`apps/api/src/seeders/demo-bottles.ts`, D-29)
- [x] README "How I worked": 2-3 paragraphs on `.claude/` (skills, agents, settings), `context/` (overview, specs, standards) and the flow overview -> specs -> `/feature` loop per spec (load, start, test, review, complete) -> code review and code-scanner before each merge
- [x] `ANSWERS.md` at the root with the user's answers to the 5 questions (texts from the user, not written by AI), linked from the README and `PR.md`
- [x] Screenshots at 375x812 and 1280x800 (cellar with a few bottles, fresh seeded DB) in `docs/screenshots/{mobile-375.png,desktop-1280.png}`, linked in the README
- [x] Demo video or GIF (20-30 s) via Playwright MCP: choose Anna, add a bottle + "Bottle added" toast, like a bottle, switch to Mark and see the empty state; saved as `docs/demo.gif` (800px, 10 fps, embedded in the README and `PR.md`), plus an H.264 `.playwright-mcp/demo.mp4` outside the repo for sharing
- [x] Final cleanup: reword the spec 7 goal and the AGENTS.md `npm ls --all` note to list every known invalid entry: `ajv-formats` (`@hookform/resolvers`), `@apollo/server` (playground plugin peer, D-19), `webpack` (`schema-utils` peer)
- [x] New decision entry correcting D-20 (lockfile holds `webpack` 5.106.2, invalid against `schema-utils` peer `^5.112.0`), pointing to D-20; D-20 itself untouched
- [x] `CLAUDE.md`: one-line product description and final Commands; `AGENTS.md`: every installed version recorded; `context/project-overview.md` Status updated
- [x] code-scanner on every file from `git diff main...feat/wine-cellar --name-only` and `/cleanup check`; findings fixed
- [x] `npm run lint && npm run typecheck && npm test && npm run build` pass from the root (with `apps/web/.env.local`)
- [x] Clean-clone check in a temp dir after `docker compose down -v`: the README steps alone bring the app up
- [x] `PR.md` (gitignored): Summary, Key decisions (like assumption FIRST, then one line per `docs/decisions.md` entry with a link, no repetition), Assumptions, How to run and test, Screenshots (+ demo video link), Next steps, link to `ANSWERS.md`
- [x] `PR.md` Next steps: pagination, edit/delete, real auth via Cognito, CI, e2e tests; then deferred items with links: Nest 12 / MikroORM 7 (D-15), multer and ajv advisories (D-23), web/api URL check parity (D-28), nested inputs in the `ValidationPipe` `exceptionFactory` (D-21)
- [ ] PR `feat: Mini Wine Cellar` opened with `gh pr create --base main --head feat/wine-cellar --body-file PR.md` after spec 6 is merged into `feat/wine-cellar` and pushed; not merged

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

- Branch: `spec/6-delivery` from `feat/wine-cellar`. Runs after spec 7 (merged).
- `ANSWERS.md` already exists (untracked) with all 5 answers written by the user. Do not rewrite it; only link it and commit it.
- Like assumption wording: each user sees only their own bottles, so "one like per user" would keep the count at 0 or 1; a like is a counter with an atomic increment (D-1, D-30). One or two sentences in the README app description and the FIRST item of `PR.md` Key decisions.
- Screenshots and video on a fresh database: `docker compose down -v`, `docker compose up -d`, `npm run db:migrate`, `npm run db:seed`. `down -v` wipes the local DB volume (bottles added by hand are lost).
- Playwright MCP has no record tool in the tool list: the video needs either the MCP `--save-video` option or a context with `recordVideo` through `browser_run_code_unsafe`.
- `PR.md` is gitignored and never committed. The PR is never merged; never merge into `main`, never force-push. Spec branch stays local.
- Next free decision number: D-31 (the D-20 correction).
- Independent review (a separate model session without project context) after the code-scanner pass: fixed the stale addBottle after a user switch (D-33), out-of-order like counts (D-34), the like reload error (D-32), CORS_ORIGIN in production (D-35), formatError and AddBottleInput tests, messages, picker placeholder, img referrer, scaffold leftovers, a clear start error without Postgres. Kept: the mocked SQL in the like unit test (integration test in Next steps), Sonner's classes, web version ranges.
- Out of scope (Optional): third screenshot `form-errors-375.png`; `${POSTGRES_PORT:-5432}` in `docker-compose.yml`.

### Testing

1. Fresh clone in a temp dir, follow the README word for word: the web app on 3000 shows the 3 users, Anna has the demo bottles, adding and liking work
2. code-scanner and `/cleanup check` report nothing left to fix
3. `npm run lint && npm run typecheck && npm test && npm run build` from the root (with `apps/web/.env.local` copied as the README says): all green
4. Without `apps/web/.env.local`, `npm run build` fails with the `NEXT_PUBLIC_API_URL` message, as the README warns
5. Open the README on GitHub: screenshots render, links to `ANSWERS.md`, `docs/decisions.md` and the demo video work
6. `gh pr view --web`: the PR `feat: Mini Wine Cellar` is open, base `main`, head `feat/wine-cellar`, the body has all six sections and the `ANSWERS.md` link

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
- Spec 2, API Phase 1: api downgraded to Nest 11.2 + MikroORM 6.6 (Nest 12 / MikroORM 7 are ESM-only and break CJS Jest), engines `^22.13.0 || >=24.0.0`; one `mikro-orm.config.ts` for Nest and the CLI (ts-node, `DATABASE_URL` fallback outside production); `User` and `Bottle` entities, ascending `(owner_id, created_at, id)` index scanned backwards, `created_at` set by the database; initial migration with a hand-written `down`; seeder with fixed uuids; `UsersService` and `BottlesService` (atomic owner-scoped `like`, `NotFoundException` for foreign or missing); `db:migrate` / `db:seed` scripts; `BottlesService` unit tests; decisions D-14 to D-18
- Spec 3, API Phase 2: Apollo GraphQL at `/graphql` (`@nestjs/graphql` / `@nestjs/apollo` 13, Apollo Server 5 via `@as-integrations/express5`, graphql 16), `schema.gql` written outside production; `UserIdGuard` on `x-user-id` with `@CurrentUser()` and unit tests; `UsersResolver.users` public, guarded `BottlesResolver` (`myBottles`, `addBottle`, `likeBottle`); `AddBottleInput` with shared limits, trimming, empty photoUrl as absent, https without credentials, vintage max per validation; CORS and global `ValidationPipe` with per-field messages; `formatError` as the only error mapper; root `.npmrc` `legacy-peer-deps`, api lockfile subtree re-resolved, `@graphql-tools/utils` override; decisions D-19 to D-25
- Spec 4, Web Phase 1: shadcn/ui on Radix (`radix-nova`, components import the `cn` package), light theme with wine-red `--primary` and neutral `--accent`; GraphQL Codegen client preset from `apps/api/schema.gql` into committed `src/gql/`; Apollo Client 4 per `Providers` mount with a `SetContextLink` that adds `x-user-id` at request time; `current-user-store` over `localStorage` via `useSyncExternalStore` (server snapshot `null`, cross-tab `storage` incl. `clear()`, memory fallback when storage is blocked); `resetStore` on every user switch; header user picker with loading and error states; `/` prompt or name placeholder; `NEXT_PUBLIC_API_URL` localhost fallback outside production, production build fails without it; graphql 16 shared with the api; unit tests for `resolveApiUrl` and the store; decisions D-26, D-27
- Spec 5, Web Phase 2: `addBottleSchema` (Zod 4) with shared limits, year read at validation time, photoUrl mirroring the api (https only, no credentials, dotted hostname, max 2048); `AddBottleForm` on react-hook-form + `zodResolver` with server `BAD_USER_INPUT` fields mapped through `setError` (focus on the first) and an alert only for other errors; `addBottle` prepends to the cached `myBottles`; `BottleList` loading / empty / error states keeping cached bottles on a failed refetch; `BottleCard` with a 4:3 photo and placeholder; `LikeButton` with an `optimisticResponse` built from the cached count so clicks stack, rollback on error; responsive cellar layout, form keyed by user; GraphQL documents in `src/graphql`, codegen `nonOptionalTypename`; tests for the schema, field error mapping and `optimisticLike`; decision D-28
- Spec 7, UI Polish Phase 1: six demo bottles for Anna in the seed (`demo-bottles.ts`, fixed ids, fixed past `created_at`, `upsertMany` merge on `id` so a reseed resets demo rows incl. likes 0-5 and keeps UI-added bottles), fictional wines from real regions, Wikimedia Commons photos (CC0 / CC BY 2.0, source and author next to each URL), one bottle without a photo, Mark and Taras empty; seeder glob narrowed to `*.seeder.{js,ts}`; spec validating every entry through `AddBottleInput` plus hosts, likes range and ids; card with vintage `Badge`, region with `MapPinIcon` (`wrap-anywhere`), like pop animation keyed per click and gated by `motion-safe`; Sonner `Toaster` (light theme, no `next-themes`) with a "Bottle added" toast only; header `WineIcon`, `icon.svg` favicon replacing `favicon.ico`, product description; skeleton cards, "Try again" via `refetch`, persistent `<output aria-live>` and focus on the list after a retry; picker `w-36` on mobile so the title fits; decisions D-29, D-30
