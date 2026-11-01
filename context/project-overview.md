# Mini Wine Cellar Project Specifications

## Problem (Core Idea)

Wine lovers who keep bottles at home lose track of what they own. Mini Wine Cellar is a small full-stack app where each user keeps a personal list of bottles, adds new ones in a few seconds and likes the ones they enjoy.

## Users

- **Cellar owner**: picks themselves from a user dropdown (fake login), adds bottles, browses their own list, likes bottles. Sees and changes only their own bottles.
- **Developer**: clones the repo, starts Postgres with docker-compose, runs the migrations and the seed, and starts both apps.

## Core Features

A. **Fake login.** A dropdown in the header lists the 3 seeded users. The chosen `userId` is kept on the client and sent as the `x-user-id` header on every GraphQL request. Until a user is chosen, the cellar shows a "choose a user" prompt instead of the list and the form.

B. **Add a bottle.** Form fields: name, producer, vintage, region, optional photo URL. react-hook-form + Zod with clear, field-level messages. The owner always comes from the request context, never from the input. The new bottle appears at the top of the list without a reload.

C. **My bottles.** The current user's bottles, newest first (`created_at DESC, id DESC`), not paginated. Each card shows the photo (or a placeholder), name, producer, vintage, region and the like count. Loading, empty and error states.

D. **Like a bottle.** A like button on each card increments a counter (no toggle, no per-user like record). The count updates instantly through an Apollo `optimisticResponse`; the server does an atomic `likes_count = likes_count + 1`.

E. **Ownership.** Every bottle query and mutation is scoped to the user from the context. Liking someone else's bottle returns `NotFound`, the same as a missing id, so ids of other users' bottles are not revealed. "Change only own bottles" in the brief is covered by the like: there is no edit or delete, and the only mutations are `addBottle` and `likeBottle`.

### GraphQL contract (code-first, Apollo driver)

| Operation | Auth | Input | Returns | Errors |
| --- | --- | --- | --- | --- |
| `query users` | public | none | `[User!]!` (for the dropdown) | none |
| `query myBottles` | `x-user-id` | none | `[Bottle!]!`, newest first | `UNAUTHENTICATED` |
| `mutation addBottle(input: AddBottleInput!)` | `x-user-id` | name, producer, vintage, region, photoUrl? | `Bottle!` | `UNAUTHENTICATED`, `BAD_USER_INPUT` |
| `mutation likeBottle(id: ID!)` | `x-user-id` | bottle id | `Bottle!` with the new `likesCount` | `UNAUTHENTICATED`, `NOT_FOUND` |

## Data Model (rough draft)

- **User**: `id` (uuid, PK), `name` (text, unique). Created only by the seeder (3 users).
- **Bottle**: `id` (uuid, PK), `owner_id` (FK -> user, not null), `name`, `producer`, `region` (text, not null), `vintage` (int, not null), `photo_url` (text, nullable), `likes_count` (int, not null, default 0), `created_at` (timestamptz, not null, default now).
- Index `(owner_id, created_at DESC, id DESC)` serves `myBottles`.
- Validation limits (shared by web and api through `packages/shared`): name, producer, region required, trimmed, 1-100 chars; vintage integer from 1900 to the current year; photoUrl optional, `https://` only, max 2048 chars.

## Tech Stack

npm workspaces monorepo (npm 10, Node 20.12+ via root `engines`, tested on 24; 20.12 for `process.loadEnvFile`, Next 16 needs 20.9+). Library versions for the planned items are checked at install time and recorded in `AGENTS.md`.

| Area | Now | Planned |
| --- | --- | --- |
| Web (`apps/web`) | Next.js 16.4 App Router, React 19.3, Tailwind CSS 4.3, TypeScript 5.9, port 3000 | Apollo Client + GraphQL Codegen (reads `apps/api/schema.gql`), react-hook-form + Zod, shadcn/ui; calls the API through `NEXT_PUBLIC_API_URL` (specs 4-5) |
| API (`apps/api`) | NestJS 12.3 on Express 5, TypeScript 6.0 | Port 4000, GraphQL at `/graphql` via `@nestjs/graphql` + `@nestjs/apollo` (`ApolloDriver`, code-first, `autoSchemaFile: schema.gql`), CORS for `http://localhost:3000`, class-validator + global `ValidationPipe` (specs 1-3) |
| Shared (`packages/shared`) | `packages/*` declared, empty | Validation limits and the vintage range used by both apps (spec 1) |
| Database / ORM | none | PostgreSQL via docker-compose; MikroORM with `@mikro-orm/nestjs` (request context), `@mikro-orm/migrations`, `@mikro-orm/seeder` (spec 2) |
| Auth | none | Fake: `x-user-id` header, Nest guard puts the user into the GraphQL context, `@CurrentUser()` decorator (spec 3) |
| Lint / format | Biome 2.4 (web); oxlint + Prettier (api) | One Biome at the root for all workspaces, `noExplicitAny: error`; oxlint and Prettier removed (spec 1) |
| Tests | Jest 30 + ts-jest + supertest (api); none (web) | Jest in both apps, web via `next/jest` (not Vitest, the brief requires Jest) (spec 1) |
| Root scripts | none (`test` is a failing placeholder) | `dev`, `lint`, `typecheck`, `test` via workspaces; typecheck runs each app's own TypeScript (spec 1) |
| CI / deploy | none | none, local run only (see Assumptions) |

## Architecture Notes

- **Request flow (api)**: Apollo -> `x-user-id` guard -> resolver (parse input, call service) -> service (business logic, MikroORM) -> Postgres. Resolvers hold no logic.
- **Auth seam**: the guard is the only place that knows how a user is identified. It loads the user by `x-user-id` and puts it into the GraphQL context; resolvers read it through `@CurrentUser()`. Swapping to Cognito later replaces only the guard. `users` is the one public query.
- **Ownership in the service layer**: `myBottles` filters by owner; `addBottle` sets owner from the context; `likeBottle` runs a conditional `UPDATE ... SET likes_count = likes_count + 1 WHERE id = ? AND owner_id = ? RETURNING *` and throws `NotFoundException` on 0 rows. One statement, so it is atomic and needs no check-then-update.
- **Errors**: services throw Nest exceptions; `formatError` in `GraphQLModule` is the single place that maps them to GraphQL error codes and strips stack traces and internal messages.
- **MikroORM**: a fresh `EntityManager` per request via `@mikro-orm/nestjs` request context. Schema changes only through migrations; users only through the seeder.
- **Schema pipeline**: the api writes `apps/api/schema.gql` on start (code-first). Codegen in `apps/web` reads that file, not the running server, and generates typed documents. Both `schema.gql` and the generated code are committed, so typecheck works without a running API.
- **Web data flow**: the cellar is client-rendered (the user id lives in the browser). An Apollo link adds `x-user-id`. `addBottle` prepends the result to the cached `myBottles`; `likeBottle` uses `optimisticResponse` (`likesCount + 1`) and Apollo rolls back on error. Switching users resets the Apollo store.
- **Shared package**: `packages/shared` is plain TypeScript with no runtime dependencies, built to CommonJS + `.d.ts` so both the CommonJS Nest app and Next.js can import it. The Zod schema (web) and the class-validator DTO (api) both read their limits from it. The build runs automatically (root `prepare` after `npm install`, plus `predev` / `pretest` / `pretypecheck` hooks), so nobody builds it by hand.
- **Run flow (README)**: `npm install` -> `docker compose up -d` -> migration -> seed -> `npm run dev`. No other manual steps. `npm run dev` starts both apps in parallel with `concurrently`.
- **Decision log**: non-obvious decisions live in `docs/decisions.md` (D-1, D-2, ...); `PR.md` links to it instead of repeating it.

## Monetization (if any)

None.

## UI / UX

- One page (`/`): header with the app name and the user dropdown; below it the add-bottle form and the bottle list.
- Mobile first. At 375px: one column, the form above the list, full-width cards, tap targets at least 44px. At 1280px: the form in a side column, the list as a responsive card grid.
- shadcn/ui components (Button, Input, Label, Card, Select) on Tailwind; light theme, neutral palette with a wine-red accent.
- Photo: plain `<img>` with a fixed aspect ratio and a placeholder when there is no URL or it fails to load. Biome's `noImgElement` is suppressed only at that element with a `biome-ignore` comment that gives the reason (photos come from arbitrary domains), never globally.
- Validation messages under each field, shown on submit and then on change. Server errors appear as an inline alert above the form or on the card.
- UI text in English.

## Roadmap

Ordered specs in `context/features/`. Branch per spec: `spec/<n>-<name>` from `feat/wine-cellar`.

1. `monorepo-phase-1-spec.md` (`spec/1-setup-monorepo`): boilerplate removed, root Biome (`noUnusedImports`, `noUnusedVariables` as error), strict tsconfig flags in each app's own tsconfig (`noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`), `engines` node >=20.12, root scripts (`dev` via `concurrently`), Jest everywhere, `packages/shared` with auto build, docker-compose Postgres, `.env.example`, api port 4000, permissions. Depends on: none.
2. `api-phase-1-spec.md` (`spec/2-api-data`): MikroORM config, User and Bottle entities, first migration, seeder (Anna, Mark, Taras), Users/Bottles services with unit tests, `db:*` scripts. Depends on: 1.
3. `api-phase-2-spec.md` (`spec/3-api-graphql`): Apollo GraphQL at `/graphql`, CORS, `ValidationPipe`, `formatError`, `x-user-id` guard and `@CurrentUser()`, resolvers, `schema.gql`. Depends on: 2.
4. `web-phase-1-spec.md` (`spec/4-web-foundation`): shadcn/ui, Apollo Client with the `x-user-id` link, Codegen, stored user and the header picker. Depends on: 3.
5. `web-phase-2-spec.md` (`spec/5-web-cellar`): add-bottle form (Zod + react-hook-form), bottle list with states, optimistic like, responsive layout. Depends on: 4.
6. `delivery-phase-1-spec.md` (`spec/6-delivery`): README with "How I worked", `ANSWERS.md`, screenshots at 375px and 1280px, code-scanner + `/cleanup check`, full checks, `PR.md` and the open PR. Depends on: 5.

Each spec ends with an "Optional (only if time is left)" section; those items are not required for `/feature complete`.

## Status

Scaffold and AI harness only. No spec started.

## Assumptions

- A1 Field limits: name, producer, region required, trimmed, 1-100 chars; photoUrl max 2048. Long enough for real labels, short enough for cards. Alt: 255 each.
- A2 IDs: uuid for users and bottles. Not guessable, safe to expose. Alt: serial integers.
- A3 Seed users: Anna, Mark, Taras with fixed uuids. Fixed ids keep the stored choice valid across reseeds. Alt: random ids.
- A4 `users` query is public. The dropdown must load before anyone is "logged in". Alt: hardcode users in web.
- A5 Missing or unknown `x-user-id`: `UNAUTHENTICATED` error. Same rule for a bad and a missing header. Alt: treat as empty cellar.
- A6 Stored user: `localStorage` in the browser. Survives reloads, no server session needed. Alt: cookie (enables SSR).
- A7 Cellar is client-rendered with Apollo Client. Follows from A6, no SSR data fetching. Alt: `@apollo/client-integration-nextjs` with SSR.
- A8 No edit or delete of bottles (decided). "Change" in the brief is the like; ownership is enforced there.
- A9 Duplicates allowed: no unique constraint on bottles. A user may own two bottles of the same wine. Alt: unique (owner, name, producer, vintage).
- A10 Vintage upper bound is the current year at validation time (UTC on the server). Next year's vintages are rejected. Alt: current year + 1.
- A11 Photo shown with plain `<img>`, not `next/image`. Arbitrary hosts would need `remotePatterns` for every domain. `noImgElement` is suppressed per element with a `biome-ignore` reason, not globally. Alt: `next/image` with `unoptimized`.
- A12 After `addBottle`, the result is prepended to the cache. No extra network request. Alt: refetch `myBottles`.
- A13 `schema.gql` and Codegen output are committed. Typecheck and build work without a running API. Alt: generate in CI/predev.
- A14 `packages/shared` is built to CommonJS with its own `tsc`, automatically via root `prepare` and `predev` / `pretest` / `pretypecheck`. Both the CJS Nest app and Next.js can import it, and nobody builds it by hand. Alt: TS source with `transpilePackages` plus path mapping in api.
- A15 Tests are unit only: BottlesService, the guard, shared limits, the web Zod schema. The scaffold e2e test (hits `GET /`) is removed in spec 1. Alt: e2e with supertest against the docker Postgres.
- A16 Env names: `DATABASE_URL`, `PORT` (4000), `CORS_ORIGIN` (`http://localhost:3000`) in api; `NEXT_PUBLIC_API_URL` (`http://localhost:4000/graphql`) in web. Alt: separate `DB_HOST`/`DB_USER`/... vars.
- A17 UI language: English. Matches the repo language. Alt: Ukrainian UI.
- A18 No CI and no deploy. Local run per the README; CI goes to Next steps. Alt: GitHub Actions running lint, typecheck, test.

## Open Questions

None.
