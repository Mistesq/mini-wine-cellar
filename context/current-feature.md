# Current Feature: API Phase 2 - GraphQL, Fake Auth and Validation

<!-- H1 gets the feature name when active, e.g. "# Current Feature: Add Navbar" -->

## Status

<!-- Not Started | In Progress | Complete -->

In Progress

## Goals

<!-- Checklist of what success looks like, filled by `/feature load`. Each goal is checked off when done, so the list doubles as plan vs actual. -->

- [x] Install `@nestjs/graphql` / `@nestjs/apollo` 13.x, `@apollo/server`, `graphql`, `class-validator`, `class-transformer` (versions checked via Context7, recorded in `AGENTS.md`)
- [x] `GraphQLModule.forRoot` with `ApolloDriver`, code-first, `autoSchemaFile` -> `apps/api/schema.gql` (committed), `sortSchema: true`
- [x] `main.ts`: CORS for `CORS_ORIGIN` allowing `content-type` and `x-user-id`; global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- [x] `UserIdGuard`: missing, non-uuid or unknown `x-user-id` -> `UnauthorizedException`; valid user put into the GraphQL context; `@CurrentUser()` reads it. The guard is the only code that knows how a user is identified
- [x] `UsersResolver.users` (public); `BottlesResolver` (guarded) with `myBottles`, `addBottle(input)`, `likeBottle(id)`. Resolvers only map input, call the service, return
- [x] `User` and `Bottle` GraphQL models (`Bottle` without owner; `photoUrl` nullable; `createdAt: DateTime`)
- [x] `AddBottleInput` with class-validator and limits from `@mini-wine-cellar/shared`: trimmed required strings, integer vintage 1900..`getMaxVintage()` via a custom constraint evaluated per validation, optional `https://` photoUrl up to 2048 chars; `likeBottle` validates `id` as a uuid
- [x] `formatError` (`src/graphql/format-error.ts`) as the single mapping to `UNAUTHENTICATED`, `BAD_USER_INPUT` (with field messages), `NOT_FOUND`, or `INTERNAL_SERVER_ERROR` with a generic message; no stack traces
- [x] Guard unit tests: missing header, non-uuid, unknown user, valid user put into the context

## Notes

<!-- Additional context, constraints, API contract, out of scope. -->

Branch: `spec/3-api-graphql` from `feat/wine-cellar`.

### GraphQL contract

| Operation | Header | Success | Errors |
| --- | --- | --- | --- |
| `users: [User!]!` | none | `[{ id, name }]` | none |
| `myBottles: [Bottle!]!` | `x-user-id` | own bottles, newest first | `UNAUTHENTICATED` |
| `addBottle(input: AddBottleInput!): Bottle!` | `x-user-id` | the new bottle, `likesCount: 0` | `UNAUTHENTICATED`, `BAD_USER_INPUT` |
| `likeBottle(id: ID!): Bottle!` | `x-user-id` | the bottle with the new `likesCount` | `UNAUTHENTICATED`, `BAD_USER_INPUT`, `NOT_FOUND` |

`Bottle`: `id`, `name`, `producer`, `vintage: Int`, `region`, `photoUrl: String` (nullable), `likesCount: Int`, `createdAt: DateTime`. The owner is not exposed.

### Files

- `apps/api/src/auth/{user-id.guard.ts,user-id.guard.spec.ts,current-user.decorator.ts}`
- `apps/api/src/users/{user.model.ts,users.resolver.ts}`
- `apps/api/src/bottles/{bottle.model.ts,add-bottle.input.ts,bottles.resolver.ts}`
- `apps/api/src/graphql/format-error.ts`
- `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/schema.gql` (generated)

### Gotchas

- Nest 11 (D-15): `@nestjs/graphql` / `@nestjs/apollo` 13.x only; 14.x needs Nest 12 and is ESM-only. Check which `@apollo/server` major and Express integration package the installed `@nestjs/apollo` expects (Apollo Server 5 has no built-in Express integration)
- No `@Max(getMaxVintage())`: decorator arguments are evaluated once at boot. Use a custom constraint
- Apollo CSRF prevention rejects simple requests: curl and the web client send `content-type: application/json`
- The guard reads the request through `GqlExecutionContext`, not `switchToHttp()`
- `autoSchemaFile` resolves from the process cwd (`apps/api` with `-w api`)
- Existing services: `UsersService.findAll/findById`, `BottlesService.findForOwner/create/like` (like already throws `NotFoundException` for foreign or missing)
- Env: `PORT`, `CORS_ORIGIN` (already in `.env.example`)

### Decisions (agreed before start)

- Apollo's own codes (`GRAPHQL_PARSE_FAILED`, `GRAPHQL_VALIDATION_FAILED`, Apollo's `BAD_USER_INPUT`) pass through unchanged, without stack. Nest exceptions map to the 4 codes; anything unknown becomes `INTERNAL_SERVER_ERROR` with a generic message, and the real error is logged on the server in `formatError`
- `includeStacktraceInErrorResponses: false` in `GraphQLModule`, so Apollo adds no stack in dev either
- `BAD_USER_INPUT` field messages as `extensions.fields: { <field>: string[] }`, built by `exceptionFactory` in the `ValidationPipe`
- Strings trimmed with `@Transform` before validation (`transform: true`), matching the Zod `trim` on the web
- Keep Apollo `csrfPrevention` on, even when curl without `content-type` fails

### Decisions made during start (D-entries on complete)

- Root `.npmrc` with `legacy-peer-deps=true`: `@nestjs/apollo` 13 depends on the deprecated playground plugin (peer `@apollo/server` ^4); npm 11 overrides do not lift the peer conflict. `playground: false` keeps the plugin unused. Alternatives: one-off `--legacy-peer-deps` (fresh installs fail), Apollo Server 4 (EOL). Known side effect: `npm ls` flags `schema-utils` 4.8.1 (peer `webpack ^5.112`) against the `webpack` 5.106.2 that `@nestjs/cli` pins; both come only from the CLI's webpack build mode, which `nest-cli.json` does not use (the api builds with `tsc`), so nothing is installed for it
- `apps/api/node_modules/*` entries dropped from the lockfile and reinstalled: Nest 11 sat nested in `apps/api` (leftover of the spec 2 downgrade) while the new packages hoisted to the root, so `@nestjs/graphql` could not resolve `@nestjs/common`. Only `@types/node` / `undici-types` stay nested; no version moved except the root peer-only webpack 5.112 (gone, api builds with `tsc`)
- `autoTransformHttpErrors: false`: the driver's own mapping turns a 404 into `INTERNAL_SERVER_ERROR` and leaks the exception response as `extensions.originalError`; `formatError` stays the only mapper
- `likeBottle(id)` validated with `ParseUUIDPipe` (`BAD_USER_INPUT`, message only, no `fields`)
- One `UNAUTHENTICATED` message for missing, non-uuid and unknown `x-user-id` (A5)

### Decisions made during review (D-entries on complete)

- `photoUrl`: after trim an empty string becomes `undefined`, so `@IsOptional` skips it and `""` / `"   "` save as `photoUrl: null` (checked with curl)
- `autoSchemaFile`: `true` (schema in memory) when `NODE_ENV=production`, the `schema.gql` path otherwise (checked: production start leaves the file untouched)
- `readFields` in `format-error.ts` uses an `isFieldMessages` type guard instead of a cast
- Validation messages stay as class-validator defaults (web shows its own Zod messages)
- `@mini-wine-cellar/shared: "*"` declared in the api `dependencies` (it resolved only through the hoisted workspace symlink); spec 5 got the same goal for web
- `photoUrl` `IsUrl` with `disallow_auth: true`: `https://user:pass@host/x.jpg` gives `BAD_USER_INPUT` (checked with curl)
- `hideSchemaDetailsFromClientErrors` only in production, like `autoSchemaFile`: drops the "Did you mean ...?" hints, codes unchanged (checked: dev keeps the hint, production drops it, both `GRAPHQL_VALIDATION_FAILED`)
- `exceptionFactory` keeps reading only top-level `constraints`: `AddBottleInput` is flat, nested inputs would need `children` flattening
- Root `package.json` `overrides`: `@nestjs/graphql` -> `@graphql-tools/utils` `^12.1.0`. `@nestjs/graphql` 13.4.5 pins 12.0.0, which has two high prototype-pollution advisories: [GHSA-7mx3-vvmw-hjmv](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv) (`mergeDeep`, `<=12.0.0`) and [GHSA-c4qx-w738-7hr3](https://github.com/advisories/GHSA-c4qx-w738-7hr3) (`mergeIncrementalResult`, `<=12.0.1`). npm audit's only fix is `@nestjs/graphql` 14 (Nest 12, ESM, against D-15). Unlike the playground peer, this is a regular dependency, so the override works; the stale nested lock entry had to be dropped once. Verified: `npm ci` from scratch, lint, typecheck, test, build, all Testing curl scenarios; audit runtime back to the 6 findings of `feat/wine-cellar`, total 27 (base 28)
- Accepted runtime advisories, fixes only in Nest 12 or tooling majors: `multer` / `@nestjs/platform-express` high DoS via `fileFilter` ([GHSA-q7qp-rjg7-q26m](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)): the api has no file upload, so multer never runs; `ajv` moderate ReDoS with `$data` ([GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6)) through `@mikro-orm/migrations` -> `umzug` -> `@rushstack/*`: only the migration CLI loads it, never with untrusted schemas. Also goes to README Next steps (spec 6)

### Out of scope

- `format-error.spec.ts` (spec's Optional section)
- Anything web-side (specs 4-5)

### Testing steps

1. `npm run start:dev -w api`: `apps/api/schema.gql` is written and matches the contract
2. `curl -s localhost:4000/graphql -H 'content-type: application/json' -d '{"query":"{ users { id name } }"}'` returns the 3 seeded users
3. `{ myBottles { id } }` without the header gives `UNAUTHENTICATED`; with `-H 'x-user-id: <Anna id>'` it gives `[]`
4. `addBottle` as Anna with valid input returns `likesCount: 0`; `vintage: 1800`, an `http://` photoUrl or an empty name gives `BAD_USER_INPUT` with field messages
5. `likeBottle` as Anna twice gives 1, then 2; as Mark on Anna's bottle gives `NOT_FOUND`; `id: "abc"` gives `BAD_USER_INPUT`
6. No error response contains a stack trace. `npm test`, `npm run typecheck`, `npm run lint` pass

## History

<!-- Completed features, append only, oldest to newest. -->

- Project setup and boilerplate cleanup
- Spec 1, Monorepo Phase 1: scaffold boilerplate removed, one root Biome (Nest overrides), strict tsconfig flags, `packages/shared` with `BOTTLE_LIMITS` / `getMaxVintage` and auto build, root scripts (`dev` via `concurrently`), Jest in web and shared, Postgres 18 in docker-compose, Node engines `^22.22.3 || ^24.15.0 || >=26.0.0`, decisions D-10 to D-13
- Spec 2, API Phase 1: api downgraded to Nest 11.2 + MikroORM 6.6 (Nest 12 / MikroORM 7 are ESM-only and break CJS Jest), engines `^22.13.0 || >=24.0.0`; one `mikro-orm.config.ts` for Nest and the CLI (ts-node, `DATABASE_URL` fallback outside production); `User` and `Bottle` entities, ascending `(owner_id, created_at, id)` index scanned backwards, `created_at` set by the database; initial migration with a hand-written `down`; seeder with fixed uuids; `UsersService` and `BottlesService` (atomic owner-scoped `like`, `NotFoundException` for foreign or missing); `db:migrate` / `db:seed` scripts; `BottlesService` unit tests; decisions D-14 to D-18
