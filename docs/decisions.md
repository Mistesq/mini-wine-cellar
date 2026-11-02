# Decisions

Non-obvious decisions, in the order they were made. Format and rules: Decisions in `context/coding-standards.md`.

## Start here

The decisions that shape the app most, one line each:

- A like is a counter with one atomic increment, because users see only their own bottles: [D-1](#d-1-a-like-is-a-counter-with-an-atomic-sql-increment), [D-30](#d-30-why-a-like-is-a-counter-completes-d-1), [D-32](#d-32-likebottle-is-one-atomic-update-plus-a-separate-read-corrects-d-1).
- Another user's bottle returns NotFound, not Forbidden, so its id is never confirmed: [D-2](#d-2-another-users-bottle-returns-notfound-not-forbidden).
- The `x-user-id` guard is the only auth seam; real auth replaces only the guard: [D-3](#d-3-the-guard-is-the-only-place-that-knows-how-a-user-is-identified).
- The api stays on Nest 11 and MikroORM 6, the last CommonJS majors that Jest loads without experimental flags: [D-15](#d-15-the-api-stays-on-commonjs-majors-nest-11-and-mikroorm-6).
- `formatError` is the one place that decides what a client sees in an error: [D-21](#d-21-formaterror-is-the-only-error-mapper).
- The web cache is protected against a user switch mid-request and against like responses arriving out of order: [D-33](#d-33-a-user-switch-does-not-cancel-an-addbottle-in-flight-corrects-d-27), [D-34](#d-34-the-cached-like-count-never-goes-down).
- The web form and the api read the same validation limits from `packages/shared`: [D-4](#d-4-validation-limits-live-in-packagesshared).

## D-1: A like is a counter with an atomic SQL increment
- Status: corrected by [D-32](#d-32-likebottle-is-one-atomic-update-plus-a-separate-read-corrects-d-1) (and completed by [D-30](#d-30-why-a-like-is-a-counter-completes-d-1)).
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
- Status: index superseded by [D-17](#d-17-the-mybottles-index-is-ascending).
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
- Status: value replaced by [D-16](#d-16-node-engines-recalculated-after-the-nest-11-downgrade).
- Context: the plan said `>=20.12` (for `process.loadEnvFile` and Next 16), but npm printed `EBADENGINE` for packages in the tree.
- Decision: root `engines.node` is `^22.22.3 || ^24.15.0 || >=26.0.0`, the strictest range found in the `engines` of every package in the lockfile (Nest CLI via `@angular-devkit/*`). It also covers `concurrently` 10 and Nest's `file-type` (>=22) and `@nestjs/schematics` (>=22.12). `@types/node` in both apps is pinned to the lowest supported major (22), so the types never offer APIs that the oldest supported Node lacks.
- Alternatives: `>=20.12` (understates what the tree needs); `>=22.22.3` (wrongly allows 24.0-24.14).
- Why: `engines` should tell a developer the real minimum before something fails at runtime, and only the full tree knows it.

## D-13: Postgres 18 in docker-compose
- Status: MikroORM version per [D-15](#d-15-the-api-stays-on-commonjs-majors-nest-11-and-mikroorm-6).
- Context: the compose file pins a major version, which should be the latest stable one that MikroORM supports.
- Decision: `postgres:18-alpine`, with the named volume mounted at `/var/lib/postgresql`.
- Alternatives: 19 (only release candidates on Docker Hub); 17 (older, no benefit here).
- Why: 18 is the newest stable major and MikroORM 7.2 talks to it through `pg` 8. From 18 on the image stores data in a versioned subfolder, so mounting the old `/var/lib/postgresql/data` path would not persist data.

## D-14: MikroORM entities use legacy decorators with reflect-metadata
- Context: MikroORM offers decorators (legacy or ES spec) and decorator-free `defineEntity` / `EntitySchema` definitions, and the metadata provider has to match.
- Decision: legacy decorators from `@mikro-orm/core` with `ReflectMetadataProvider`. Nullable and union properties declare an explicit `type`, as reflection cannot see them.
- Alternatives: `defineEntity` (types inferred, no metadata provider, no decorators); `TsMorphMetadataProvider` (reads types from source, slower start, needs `@mikro-orm/reflection`).
- Why: Nest already runs with `experimentalDecorators` and `emitDecoratorMetadata`, so decorated entities match the rest of the api and spec 3's decorated GraphQL types.

## D-15: The api stays on CommonJS majors: Nest 11 and MikroORM 6
- Context: spec 2 installed MikroORM 7, then found that MikroORM 7 and Nest 12 (with `@nestjs/graphql` / `@nestjs/apollo` 14) are ESM-only. The CJS app loads them through Node's `require(esm)`, but Jest 30 does that only on Node 24.9+ with `--experimental-vm-modules`, and `jest.mock` does not apply to ESM modules there.
- Decision: `apps/api` uses the latest CommonJS majors: Nest 11.2 (common, core, platform-express, testing, cli, schematics) and MikroORM 6.6. The MikroORM CLI loads the TS config through the existing ts-node; no extra TS loader. D-13 stays: MikroORM 6.6 also talks to Postgres 18 through `pg` 8.
- Alternatives: keep Nest 12 / MikroORM 7, run Jest with `--experimental-vm-modules` and raise `engines` to 24 (tests built on `jest.unstable_mockModule`); transpile the ESM packages in Jest via `transformIgnorePatterns` (slow, breaks with each new ESM dependency); move the api to ESM.
- Why: plain `jest.mock` unit tests and Node 22 support on the reviewer's machine matter more here than the newest majors, and spec 3's GraphQL packages are CJS only on Nest 11.

## D-16: Node engines recalculated after the Nest 11 downgrade
- Context: D-12 derived `^22.22.3 || ^24.15.0 || >=26.0.0` from Nest CLI 12 (`@angular-devkit/*` 22) and `file-type` 22. After D-15 neither is in the tree.
- Decision: the D-12 rule is kept (the strictest range across the lockfile, platform-specific binaries excluded), which now gives `^22.13.0 || >=24.0.0`: `@napi-rs/wasm-runtime` sets 22.13 and Jest 30 excludes 23. `@types/node` stays on 22. This replaces the value in D-12, not its reasoning.
- Alternatives: keep the old, stricter range (no package needs it any more); `>=22.13` (wrongly allows 23).
- Why: `engines` should state the real minimum, and a stricter one would turn away Node 22 users for no reason.

## D-17: The myBottles index is ascending
- Context: `myBottles` orders by `created_at DESC, id DESC`, and MikroORM 6 cannot declare per-column sort order on an index without a raw SQL expression.
- Decision: a plain B-tree index on `(owner_id, created_at, id)`. Postgres scans it backwards (`Index Scan Backward`, no Sort node, checked with `EXPLAIN` on 20k rows).
- Alternatives: an expression index with `DESC` columns (raw SQL that the schema diff compares only by name).
- Why: a backward scan serves the same order, and the index stays declarative and fully diffed by `migration:check`.

## D-18: DATABASE_URL falls back to the docker-compose defaults
- Context: the run flow (`npm install` -> `docker compose up -d` -> migrate -> seed -> dev) has no "copy `.env.example`" step, and the repo ships no `.env`.
- Decision: `mikro-orm.config.ts` loads `apps/api/.env` with `process.loadEnvFile` when it exists. Without `DATABASE_URL` it uses `postgresql://wine:wine@localhost:5432/wine_cellar`, the compose defaults, unless `NODE_ENV` is `production`: then the app and the CLI fail at start with "DATABASE_URL must be set when NODE_ENV is production". Shell env wins over `.env`.
- Alternatives: always throw when `DATABASE_URL` is missing (adds a manual step to the local flow); always fall back (a production deploy would silently try localhost); `dotenv` (a new dependency for the same result).
- Why: the documented local flow works with no extra step, the same way `PORT` falls back to 4000, while a misconfigured production deploy fails loudly instead of connecting to the wrong database.

## D-19: Root .npmrc sets legacy-peer-deps
- Context: `@nestjs/apollo` 13 (the last line for Nest 11, D-15) depends on the deprecated GraphQL Playground plugin, whose peer is `@apollo/server` 4, while the driver itself needs `@apollo/server` 5. `npm install` fails with ERESOLVE, and npm 11 `overrides` (nested or global) do not lift a peer conflict.
- Decision: root `.npmrc` with `legacy-peer-deps=true`; `playground: false` in `GraphQLModule`, so the plugin is imported but never used. With peers no longer auto-installed, every peer a package needs is declared in `package.json` by hand. Known side effect: `npm ls` flags `schema-utils` 4.8.1 (peer `webpack ^5.112`) against the `webpack` 5.106.2 pinned by `@nestjs/cli`; both serve only the CLI's webpack build mode, which `nest-cli.json` does not use (the api builds with `tsc`).
- Alternatives: a one-off `npm install --legacy-peer-deps` (a fresh `npm install` or `npm ci` on another machine fails again); Apollo Server 4 (end of life); Nest 12 with `@nestjs/apollo` 14 (ESM-only, against D-15).
- Why: the README flow is a plain `npm install`, and the conflicting plugin never runs.

## D-20: The api subtree of the lockfile was re-resolved
- Status: corrected by [D-31](#d-31-the-root-webpack-is-51062-not-5112-corrects-d-20).
- Context: after the spec 2 downgrade, Nest 11 and its dependencies sat nested in `apps/api/node_modules`, while the new GraphQL packages hoisted to the root, so `@nestjs/graphql` could not resolve `@nestjs/common` (Jest and the app failed with "Cannot find module"). `npm dedupe` does not move packages that are already placed.
- Decision: the `apps/api/node_modules/*` entries were dropped from `package-lock.json` and reinstalled, so npm placed them again (hoisted). Only `@types/node` / `undici-types` stay nested (web uses another major). No version changed except a root `webpack` 5.112 that npm had added only as a peer. Verified with `npm ci` on a clean tree, lint, typecheck, test and build.
- Alternatives: regenerate the whole lockfile (moves every version in range); `install-strategy=nested` (duplicates Nest per workspace).
- Why: the smallest change that gives one copy of Nest that every package resolves, with the rest of the lockfile untouched.

## D-21: formatError is the only error mapper
- Context: services throw Nest exceptions, Apollo raises its own request errors, and the `@nestjs/apollo` driver has its own HTTP-error pass that turns a 404 into `INTERNAL_SERVER_ERROR` and copies the exception response into `extensions.originalError`.
- Decision: `autoTransformHttpErrors: false`, `includeStacktraceInErrorResponses: false`, and `formatError` rebuilds every error from `message`, `locations`, `path` and `code` only. `HttpException` 400 / 401 / 404 become `BAD_USER_INPUT` (with `extensions.fields: { field: string[] }` from the `ValidationPipe` `exceptionFactory`) / `UNAUTHENTICATED` / `NOT_FOUND`; Apollo's own client codes (`GRAPHQL_PARSE_FAILED`, `GRAPHQL_VALIDATION_FAILED`, its `BAD_USER_INPUT`) pass through; anything else is logged with its stack and returned as `INTERNAL_SERVER_ERROR` "Internal server error". In production `hideSchemaDetailsFromClientErrors` drops "Did you mean ...?" hints; codes stay the same. `likeBottle(id)` uses `ParseUUIDPipe`, so a bad id is `BAD_USER_INPUT` with a message and no `fields`.
- Alternatives: keep the driver's mapping and patch it in `formatError` (two places decide the code); map Apollo's codes onto the four contract codes (hides parse vs validation failures from the client).
- Why: one place decides what a client sees, so no stack, internal message or exception payload leaks, and the form gets messages per field.

## D-22: npm override lifts @graphql-tools/utils for @nestjs/graphql
- Context: `@nestjs/graphql` 13.4.5 pins `@graphql-tools/utils` 12.0.0, which has two high prototype-pollution advisories: [GHSA-7mx3-vvmw-hjmv](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv) (`mergeDeep`, `<=12.0.0`) and [GHSA-c4qx-w738-7hr3](https://github.com/advisories/GHSA-c4qx-w738-7hr3) (`mergeIncrementalResult`, `<=12.0.1`). npm audit's only fix is `@nestjs/graphql` 14 (Nest 12, against D-15).
- Decision: root `overrides` `{ "@nestjs/graphql": { "@graphql-tools/utils": "^12.1.0" } }` (the version `@apollo/server` 5 already uses). Verified with `npm ci` on a clean tree, lint, typecheck, test, build and the spec's curl scenarios; runtime audit findings went back to those of `feat/wine-cellar`.
- Alternatives: accept the risk (`mergeDeep` only sees our own code-first schema, and `@defer` / `@stream` are not used); upgrade to Nest 12.
- Why: a minor bump of a regular dependency closes both advisories, unlike the peer conflict in D-19, and nothing in the build or tests changed.

## D-23: Accepted runtime advisories in multer and ajv
- Context: after D-22, npm audit still lists runtime findings that were already on `feat/wine-cellar`, all fixed only in Nest 12 or tooling majors.
- Decision: accept them and list them in the README Next steps. `multer` / `@nestjs/platform-express` (high, DoS via a pending `fileFilter`, [GHSA-q7qp-rjg7-q26m](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)): the api has no file upload, so multer never handles a request. `ajv` and `@rushstack/*` (moderate, ReDoS with `$data`, [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6)) come through `@mikro-orm/migrations` -> `umzug` and load only in the migration CLI, never with untrusted schemas. The remaining findings are dev-only (Jest, Nest CLI).
- Alternatives: `npm audit fix --force` (downgrades Jest and moves Nest to 12); more overrides (cross majors).
- Why: none of the vulnerable code paths runs in the app, and the fixes conflict with D-15.

## D-24: AddBottleInput normalizes before it validates
- Context: the web form trims with Zod and sends an empty optional field, while class-validator's `@IsOptional` skips only `null` and `undefined`.
- Decision: `@Transform` trims every string before validation (`ValidationPipe` with `transform: true`); for `photoUrl` an empty result becomes `undefined`, so `""` and `"   "` save as `null`. `photoUrl` must be `https://` with no `user:pass@` part (`disallow_auth`), max 2048 chars. Vintage runs a custom constraint that reads `getMaxVintage()` on every validation instead of `@Max(getMaxVintage())`, which would freeze the year at boot.
- Alternatives: reject untrimmed strings; treat `""` as an invalid URL.
- Why: the api accepts what the form sends and stores the same values the form shows, and the vintage limit stays correct across New Year without a restart.

## D-25: schema.gql is written outside production only
- Context: code-first `autoSchemaFile` writes the schema on every start, and the web Codegen reads `apps/api/schema.gql` (A13). A production filesystem may be read-only.
- Decision: `autoSchemaFile` is the cwd-relative `schema.gql` path unless `NODE_ENV` is `production`, where it is `true` (schema in memory). The generated file is excluded from Biome, which would otherwise reformat it after every start.
- Alternatives: always write the file; generate it in a separate script.
- Why: development keeps the committed file fresh for Codegen, and a production start never depends on a writable disk.

## D-26: NEXT_PUBLIC_API_URL falls back to localhost outside production
- Context: the run flow has no "copy `.env.example`" step (same as D-18), and Next inlines `NEXT_PUBLIC_*` at build time, so a missing value would ship `undefined` or a localhost url to the browser.
- Decision: `resolveApiUrl` (`apps/web/src/lib/api-url.ts`) returns `NEXT_PUBLIC_API_URL`, else `http://localhost:4000/graphql` unless `NODE_ENV` is `production`, where it throws "NEXT_PUBLIC_API_URL must be set when NODE_ENV is production". It runs at module scope of `apollo-client.ts`, which `next build` evaluates while prerendering `/`, so a production build without the variable fails. The check is not in `next.config.ts`: `next typegen` (first step of `typecheck`) loads the config in the same `PHASE_PRODUCTION_BUILD` as `next build`, so it would break typecheck without an env file.
- Alternatives: always fall back (a production build would silently point at localhost); always throw (adds a manual step to the local flow); a guard in `next.config.ts` (breaks typecheck).
- Why: local dev runs right after clone, and a production bundle can never be built against localhost by accident.

## D-27: A user switch resets the Apollo store from one listener
- Status: corrected by [D-33](#d-33-a-user-switch-does-not-cancel-an-addbottle-in-flight-corrects-d-27).
- Context: the stored user can change from the header picker or from another tab (`storage` event), and the previous user's cached data must not survive the switch. Apollo's `clearStore` and `resetStore` both cancel in-flight requests and reset the mounted queries.
- Decision: `current-user-store.ts` notifies its listeners only on a real change (never on hydration), and `Providers` subscribes once and calls `client.resetStore()`. `x-user-id` is read from `localStorage` in a `SetContextLink` at request time, so the client is never rebuilt.
- Alternatives: `clearStore` in the picker's change handler (mounted queries stay reset with no refetch, and a switch in another tab is missed); recreate the client per user (loses the provider identity and remounts the tree).
- Why: one place drops the old cache whichever way the user changed, and `resetStore` refetches the mounted queries with the new header.

## D-28: The add-bottle form mirrors the api's photo rules and shows server errors per field
- Context: the api (D-24) accepts `photoUrl` only as `https://`, without `user:pass@`, at most 2048 chars, and returns `BAD_USER_INPUT` with `extensions.fields` (D-21). A form that is looser than the server would pass a value the server then rejects with no field to point at.
- Decision: `addBottleSchema` checks the same three rules, plus two that `IsUrl` applies implicitly: an explicit `https://` prefix (the URL parser also accepts `https:example.com`) and a hostname with a dot (`require_tld`, so `https://localhost/...` fails before submit). It does not copy the full FQDN rules (numeric or one-letter TLDs, bare IPv6 hosts). Any server `BAD_USER_INPUT` with `fields` still goes through `getServerFieldErrors` into react-hook-form `setError`, so whatever only the server catches shows under its field; the inline alert is only for errors without `fields` and for network failures.
- Alternatives: https only as the spec wrote it (credentials and length errors land in the alert); one alert for every server error.
- Why: the user sees each problem next to the field that caused it, whichever side caught it.

## D-29: The seed adds demo bottles for Anna and resets them on every run
- Context: after a fresh clone the cellar was empty for every user, so the reviewer, the screenshots and the demo video had nothing to show but the empty state.
- Decision: `DatabaseSeeder` upserts six demo bottles (`src/seeders/demo-bottles.ts`) for Anna only, with fixed uuids, fixed past `created_at` values and `onConflictFields: ["id"], onConflictAction: "merge"`. A reseed creates no duplicates and puts every demo field back, `likes_count` included, so the demo state is the same everywhere; bottles added through the UI have other ids and are never touched. Demo likes stay between 0 and 5: only the owner can like a bottle (D-1, D-30), so two-digit counts would not be believable. Mark and Taras stay empty to show the empty state. Wines and producers are fictional, regions are real. Photos are hotlinked from Wikimedia Commons (`upload.wikimedia.org`) under CC0 or CC BY 2.0, with the source page, author and license next to each URL; one bottle has no photo to show the placeholder. A unit test runs every entry through `AddBottleInput` validation and allows only free-license photo hosts. The seeder glob is narrowed to `*.seeder.{js,ts}`, because the default imports the spec too.
- Alternatives: insert with `onConflictAction: "ignore"` (keeps likes clicked since, so screenshots differ per machine); demo bottles for every user (no empty state to show); real wine names (generic photos would not match their labels); photos committed to `apps/web/public` (the card is built for external URLs).
- Why: one reseed gives a known, repeatable demo, and the photos stay legal to show and to hotlink.

## D-30: Why a like is a counter (completes D-1)
- Context: D-1 records the counter but not the reasoning from the brief. The brief asks for a "like count" and also says each user sees only their own bottles.
- Decision: keep D-1, a `likes_count` counter incremented atomically by `UPDATE ... SET likes_count = likes_count + 1`, with no toggle and no per-user record. With "one like per user" only the owner could ever like a bottle, so the count would always be 0 or 1 and the "like count" in the brief would mean nothing.
- Alternatives: a `like` table with `unique (user_id, bottle_id)`, a toggle mutation, and the count computed as `count(*)` (or a counter kept in sync with it).
- Why: a counter is the only reading in which "like count" is a real number when users see only their own bottles; the atomic increment keeps rapid clicks from being lost (D-1).

## D-31: The root webpack is 5.106.2, not 5.112 (corrects D-20)
- Context: D-20 says npm added a root `webpack` 5.112 as a peer while re-resolving the api subtree. The committed `package-lock.json` holds `webpack` 5.106.2 (pinned by `@nestjs/cli`), and `npm ls --all` marks it invalid against the `schema-utils` 4.8.1 peer `^5.112.0`, as D-19 already notes.
- Decision: D-20 stays as written; the lockfile is the source of truth: `webpack` 5.106.2 with one known invalid peer. `npm ls --all` has exactly three known invalid entries: `ajv-formats` (optional peer of `@hookform/resolvers`), `@apollo/server` (D-19) and `webpack`.
- Alternatives: add `webpack` ^5.112 to the api devDependencies (bumps a dependency of the Nest CLI only to silence `npm ls`); an override for `@nestjs/cli` (crosses the version the CLI pins).
- Why: `webpack` and `schema-utils` load only in the Nest CLI's webpack build mode, which `nest-cli.json` does not use, so the invalid peer changes nothing at build or run time.

## D-32: likeBottle is one atomic UPDATE plus a separate read (corrects D-1)
- Context: D-1 and the project overview described `likeBottle` as one statement (`UPDATE ... RETURNING *`). The service runs the conditional `UPDATE` through `nativeUpdate` and then reads the row back with a second query, without a transaction. The read used `findOneOrFail`, whose MikroORM `NotFoundError` would reach the client as `INTERNAL_SERVER_ERROR`.
- Decision: keep the two queries and describe them as they are. The increment stays one conditional `UPDATE`, so it is atomic and owner-scoped (D-1, D-2 hold). The read is `findOne`, and a missing row throws `NotFoundException`, the same as a failed update. The returned `likesCount` may already include likes that landed between the two queries.
- Alternatives: `UPDATE ... RETURNING *` as raw SQL with a manual entity mapping (loses MikroORM's typed filter and mapping); a transaction around both queries (one more round trip, and the count is stale as soon as it commits anyway).
- Why: the atomic increment is what keeps concurrent likes from being lost; the count a client gets back always includes its own like, and the web cache never lowers it (D-34).

## D-33: A user switch does not cancel an addBottle in flight (corrects D-27)
- Context: D-27 says `clearStore` and `resetStore` both cancel in-flight requests. In Apollo Client 4.3.5 they cancel queries only; a mutation keeps running. An `addBottle` sent as Anna that resolved after a switch to Mark prepended Anna's bottle to Mark's cached list and showed him the "Bottle added" toast. The data on the server was never wrong.
- Decision: the form records the stored user id when it submits. The mutation's cache `update`, the form reset, the toast and the error display run only if the stored user is still the same. D-27 stays the reset mechanism.
- Alternatives: abort the mutation on a switch (the server may already have saved the bottle, so the result would just be lost); refetch `myBottles` after every add instead of prepending (against A12, and the refetch would still run as Mark).
- Why: the bottle belongs to the user who submitted it, so only that user's view may show it.

## D-34: The cached like count never goes down
- Context: each `likeBottle` response carries an absolute `likesCount`. After two quick clicks the responses can arrive out of order, and Apollo writes them in arrival order, so a late lower count stayed on screen (5 in the database, 4 in the UI).
- Decision: an `InMemoryCache` type policy merges `Bottle.likesCount` as `Math.max(existing, incoming)` (`apps/web/src/lib/apollo-cache.ts`). A failed like still rolls back, because Apollo drops its optimistic layer and the base count was never raised. Unit tests cover both without a network: the test replaces the HTTP link with one whose responses it sends itself, in any order or as a failure. They show the race (a plain cache ends at 4, this one at 5) and the rollback.
- Alternatives: send likes one at a time (a queue, slower feedback); drop responses older than the latest one (needs request ordering on the client).
- Why: likes only grow (D-1, no unlike), so the highest count seen is the newest. Trade-off: if the database is reseeded while a page is open, the lower count shows only after a reload or a user switch.

## D-35: CORS_ORIGIN is required in production
- Context: `main.ts` fell back to `http://localhost:3000` in every environment, unlike `DATABASE_URL` (D-18) and `NEXT_PUBLIC_API_URL` (D-26).
- Decision: the same rule as those two: the localhost fallback only outside production; with `NODE_ENV=production` and no `CORS_ORIGIN` the api fails at start with "CORS_ORIGIN must be set when NODE_ENV is production".
- Alternatives: keep the silent fallback (a deployed web app would get CORS errors with no hint why); always require it (adds a step to the local run flow).
- Why: one rule for all three env values: local runs need no env file, and a misconfigured deploy fails loudly.
