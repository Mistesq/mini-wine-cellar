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
