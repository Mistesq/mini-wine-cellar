# API Phase 2 - GraphQL, Fake Auth and Validation

## Overview

Spec 3 (`spec/3-api-graphql`). Exposes the data layer through a code-first GraphQL API on Apollo at `/graphql`. Adds the `x-user-id` guard with `@CurrentUser()`, input validation and one place for error formatting. The schema is written to `apps/api/schema.gql` for web Codegen.

## Requirements

- Install `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`, `class-validator`, `class-transformer`. `GraphQLModule.forRoot` with `ApolloDriver`, `autoSchemaFile` -> `apps/api/schema.gql` (committed), `sortSchema: true`.
- `main.ts`: CORS for `CORS_ORIGIN` that allows the `content-type` and `x-user-id` headers. Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`.
- `UserIdGuard`: reads `x-user-id`, rejects a missing or non-uuid value or an unknown user with `UnauthorizedException`, and puts the user into the GraphQL context. `@CurrentUser()` reads it. The guard is the only code that knows how a user is identified.
- `UsersResolver.users` is public. `BottlesResolver` (guarded) has `myBottles`, `addBottle(input)` and `likeBottle(id)`. Resolvers only map input, call the service and return.
- `AddBottleInput` uses class-validator with limits from `@mini-wine-cellar/shared`: trimmed required strings, integer vintage from 1900 to `getMaxVintage()` at validation time, optional `https://` photoUrl up to 2048 chars. `likeBottle` validates `id` as a uuid.
- `formatError` in `GraphQLModule` is the single place that maps errors to `UNAUTHENTICATED`, `BAD_USER_INPUT` (with the field messages), `NOT_FOUND`, or `INTERNAL_SERVER_ERROR` with a generic message, and strips stack traces.
- Unit tests for the guard: missing header, non-uuid, unknown user, valid user put into the context.

## GraphQL Contract

| Operation | Header | Success | Errors |
| --- | --- | --- | --- |
| `users: [User!]!` | none | `[{ id, name }]` | none |
| `myBottles: [Bottle!]!` | `x-user-id` | own bottles, newest first | `UNAUTHENTICATED` |
| `addBottle(input: AddBottleInput!): Bottle!` | `x-user-id` | the new bottle, `likesCount: 0` | `UNAUTHENTICATED`, `BAD_USER_INPUT` |
| `likeBottle(id: ID!): Bottle!` | `x-user-id` | the bottle with the new `likesCount` | `UNAUTHENTICATED`, `BAD_USER_INPUT`, `NOT_FOUND` |

`Bottle`: `id`, `name`, `producer`, `vintage: Int`, `region`, `photoUrl: String` (nullable), `likesCount: Int`, `createdAt: DateTime`. The owner is not exposed.

## Files to Create

1. `apps/api/src/auth/{user-id.guard.ts,user-id.guard.spec.ts,current-user.decorator.ts}`
2. `apps/api/src/users/{user.model.ts,users.resolver.ts}`
3. `apps/api/src/bottles/{bottle.model.ts,add-bottle.input.ts,bottles.resolver.ts}`
4. `apps/api/src/graphql/format-error.ts`
5. `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/schema.gql` (generated)

## Notes

Use Context7 for the installed `@nestjs/graphql` / `@nestjs/apollo` and Apollo Server majors. The api is on Nest 11 (D-15): install `@nestjs/graphql` / `@nestjs/apollo` 13.x, as 14.x requires Nest 12 and is ESM-only.

- Apollo Server 5 has no built-in Express integration; check which integration package the installed `@nestjs/apollo` expects for Express 5.
- Do not write `@Max(getMaxVintage())`: a decorator argument is evaluated once at boot. Use a custom constraint that calls `getMaxVintage()` on every validation.
- Apollo CSRF prevention rejects simple requests: curl and the web client must send `content-type: application/json`.
- The guard gets the request through `GqlExecutionContext`, not `switchToHttp()`.
- `autoSchemaFile` resolves from the process cwd (`apps/api` when run with `-w api`).

## Environment Variables

```
PORT=
CORS_ORIGIN=
```

## Testing

1. `npm run dev -w api` (or `start:dev`): `apps/api/schema.gql` is written and matches the contract
2. `curl -s localhost:4000/graphql -H 'content-type: application/json' -d '{"query":"{ users { id name } }"}'` returns the 3 seeded users
3. The same with `{ myBottles { id } }` and no header gives `UNAUTHENTICATED`; with `-H 'x-user-id: <Anna id>'` it gives `[]`
4. `addBottle` as Anna with valid input returns `likesCount: 0`; with `vintage: 1800`, an `http://` photoUrl or an empty name it returns `BAD_USER_INPUT` with field messages
5. `likeBottle` as Anna twice gives 1, then 2; as Mark on Anna's bottle it gives `NOT_FOUND`; `id: "abc"` gives `BAD_USER_INPUT`
6. No error response contains a stack trace. `npm test`, `npm run typecheck`, `npm run lint` pass

## References

- Nest GraphQL quick start (code-first): https://docs.nestjs.com/graphql/quick-start
- Resolvers and guards with GraphQL: https://docs.nestjs.com/graphql/resolvers, https://docs.nestjs.com/guards
- Validation: https://docs.nestjs.com/techniques/validation
- Apollo Server errors and CSRF: https://www.apollographql.com/docs/apollo-server/data/errors, https://www.apollographql.com/docs/apollo-server/security/cors

## Optional (only if time is left)

- `apps/api/src/graphql/format-error.spec.ts`: each Nest exception maps to its code, an unknown error becomes `INTERNAL_SERVER_ERROR` with a generic message and no stack trace.
