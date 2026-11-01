# Decisions

Non-obvious decisions, in the order they were made. Format and rules: Decisions in `context/coding-standards.md`.

## D-1: A like is a counter with an atomic SQL increment
- Context: the brief asks for likes whose count updates instantly, without a page reload.
- Decision: `likes_count` is a column on `bottle`; `likeBottle` runs `UPDATE bottle SET likes_count = likes_count + 1 WHERE id = ? AND owner_id = ?`. No toggle, no per-user like rows. The web client shows the new count at once through an Apollo `optimisticResponse`.
- Alternatives: a `like` table with one row per user and bottle (toggle, unique constraint); read-modify-write in the service.
- Why: only owners can like their own bottles, so a per-user record adds nothing. One conditional statement cannot lose concurrent clicks and needs no transaction.

## D-2: Another user's bottle returns NotFound, not Forbidden
- Context: `likeBottle` receives a bottle id that may belong to someone else.
- Decision: the service looks the bottle up by `(id, owner)`; a foreign and a missing id both throw `NotFoundException`.
- Alternatives: `ForbiddenException` for foreign bottles.
- Why: Forbidden confirms that the id exists, which leaks other users' data. One code path for both cases is also simpler.

## D-3: The guard is the only place that knows how a user is identified
- Context: auth is fake (`x-user-id` header from a user dropdown), and it should be replaceable with real auth such as Cognito later.
- Decision: a Nest guard resolves the user and puts it into the GraphQL context; resolvers read it only through `@CurrentUser()`. Services take an owner id as an argument and never read headers.
- Alternatives: read the header in each resolver; middleware that sets a global request user.
- Why: swapping to Cognito then replaces one guard and touches no resolver or service.

## D-4: Validation limits live in packages/shared
- Context: the web form (Zod) and the API input (class-validator) validate the same fields.
- Decision: `@mini-wine-cellar/shared` exports the limits and `getMaxVintage()`; both sides import them. The package is built to CommonJS automatically on install and before dev, build, test and typecheck.
- Alternatives: duplicate the numbers in each app; share one Zod schema and run it in the API too.
- Why: one source of truth with no drift, while each side keeps its idiomatic validator and its own error messages.

## D-5: Apollo Server driver, not Mercurius
- Context: Nest GraphQL supports both the Apollo and the Mercurius drivers.
- Decision: `@nestjs/apollo` with `ApolloDriver`, code-first, schema written to `apps/api/schema.gql`.
- Alternatives: `@nestjs/mercurius` (Fastify-based).
- Why: the brief asks for Apollo Server, and the app runs on Express, which Mercurius does not target.

## D-6: The bottle list is not paginated
- Context: `myBottles` returns a user's whole cellar.
- Decision: no pagination; order `created_at DESC, id DESC`, backed by an index on `(owner_id, created_at DESC, id DESC)`.
- Alternatives: cursor pagination on `(created_at, id)`; offset pagination.
- Why: a personal cellar is small, and the brief does not ask for it. The order and index already fit a later cursor, which is listed in Next steps.

## D-7: Bottle photos use a plain img, not next/image
- Context: the photo URL is any `https://` address the user types.
- Decision: a plain `<img>` with a fixed aspect ratio and a placeholder on error. Biome `noImgElement` is suppressed only on that element with a reason.
- Alternatives: `next/image` with `remotePatterns`; `next/image` with `unoptimized`.
- Why: `remotePatterns` cannot list arbitrary domains, and `unoptimized` removes the benefit of `next/image` anyway.

## D-8: The cellar is client-rendered, the chosen user lives in localStorage
- Context: the fake login has to remember the chosen user between reloads.
- Decision: the user id is stored in `localStorage` and read through `useSyncExternalStore`; Apollo Client runs on the client and adds `x-user-id` to each request.
- Alternatives: a cookie plus server rendering with `@apollo/client-integration-nextjs`.
- Why: the simplest setup that keeps the guard as the only auth seam. A cookie and SSR would add server-side Apollo setup for a page that has no SEO needs.

## D-9: Jest in both apps, not Vitest
- Context: Next.js projects often use Vitest, and the api scaffold already ships Jest.
- Decision: Jest everywhere: ts-jest in the api and `packages/shared`, `next/jest` in the web app.
- Alternatives: Vitest in the web app.
- Why: the brief requires Jest, and one runner keeps the root `npm test` and the test style uniform.

## D-10: Biome overrides for Nest in apps/api
- Context: one root Biome config lints the Nest app, and two default behaviours broke on a throwaway Nest service.
- Decision: an `overrides` entry for `apps/api/**` turns `style/useImportType` off and sets `javascript.parser.unsafeParameterDecoratorsEnabled: true`.
- Alternatives: keep `useImportType` and mark each DI import with a suppression comment; keep Biome away from the api and lint it with another tool.
- Why: `useImportType` rewrites DI-injected classes to `import type`, which erases them and breaks `emitDecoratorMetadata`; parameter decorators such as `@Param()` and `@Args()` are a parse error without the parser flag.

## D-11: apps/web tsconfig excludes .next/dev/types
- Context: `noUnusedLocals` is on in the web app, and the `validator.ts` that `next dev` writes to `.next/dev/types` has unused imports, so typecheck and build failed after any dev run.
- Decision: `exclude` in `apps/web/tsconfig.json` lists `.next/dev/types/**`. The copy that `next typegen` and `next build` write to `.next/types` is still checked.
- Alternatives: remove the path from `include` (Next adds it back); turn `noUnusedLocals` off for the web app; delete `.next/dev` before every typecheck.
- Why: the excluded file is a dev-time duplicate of a validator that is checked anyway, and `exclude` is the only place Next does not rewrite.

## D-12: Node engines is the maximum of the dependency minimums
- Context: the plan said `>=20.12` (for `process.loadEnvFile` and Next 16), but npm printed `EBADENGINE` for packages in the tree.
- Decision: root `engines.node` is `^22.22.3 || ^24.15.0 || >=26.0.0`, the strictest range found in the `engines` of every package in the lockfile (Nest CLI via `@angular-devkit/*`). It also covers `concurrently` 10 and Nest's `file-type` (>=22) and `@nestjs/schematics` (>=22.12). `@types/node` in both apps is pinned to the lowest supported major (22), so the types never offer APIs that the oldest supported Node lacks.
- Alternatives: `>=20.12` (understates what the tree needs); `>=22.22.3` (wrongly allows 24.0-24.14).
- Why: `engines` should tell a developer the real minimum before something fails at runtime, and only the full tree knows it.

## D-13: Postgres 18 in docker-compose
- Context: the compose file pins a major version, which should be the latest stable one that MikroORM supports.
- Decision: `postgres:18-alpine`, with the named volume mounted at `/var/lib/postgresql`.
- Alternatives: 19 (only release candidates on Docker Hub); 17 (older, no benefit here).
- Why: 18 is the newest stable major and MikroORM 7.2 talks to it through `pg` 8. From 18 on the image stores data in a versioned subfolder, so mounting the old `/var/lib/postgresql/data` path would not persist data.
