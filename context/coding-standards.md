# Coding Standards

## TypeScript

- Strict mode is on in both apps (`strict: true`; the api also sets `strictPropertyInitialization: false` for Nest DI)
- No `any` types. Use proper typing or `unknown` and narrow. `apps/api/oxlint.json` currently turns `no-explicit-any` off; spec 1 replaces it with root Biome `noExplicitAny: error`
- Define types for props, API requests/responses and data models
- Use type inference where obvious, explicit types where helpful

## Boundaries

- Validate all external input at the boundary: request bodies, params, query strings, forms, env, third-party responses (libraries arrive in spec 1)
  - web: Zod schemas with react-hook-form
  - api: class-validator on input DTOs with a global `ValidationPipe`
  - Shared limits (lengths, ranges) live in `packages/shared` and both sides import them. Never duplicate a limit
- Keep business logic out of the transport layer. Nest resolvers parse input, call a service and return the result. Next route handlers and server actions do the same
- Services throw Nest exceptions (`NotFoundException`, `BadRequestException`), which become GraphQL errors. Strip stack traces and internal messages in ONE place: `formatError` in `GraphQLModule`

## Data

PostgreSQL (docker-compose) + MikroORM, added in spec 1.

- Schema changes only through MikroORM migrations. Never sync schema directly to a shared database
- Unique constraints for natural keys instead of check-then-insert
- Transactions or conditional updates for anything that must be atomic
- The bottle list is intentionally not paginated (a decision for this task). Pagination goes to Next steps in the README

## Security

- Secrets come from env, never from code or commits (`.env*` is gitignored)
- Authorization check on every mutation and every protected read
- Auth is fake: the `x-user-id` header, checked by a Nest guard (spec 1). Scope every query to that user

## React (`apps/web`)

- Functional components and hooks. One job per component
- Handle loading, empty and error states (App Router `loading.tsx` / `error.tsx` or in-component)
- Styling with Tailwind utility classes (`src/app/globals.css` imports Tailwind)

## File Organization

```text
apps/
  api/                 NestJS
    src/
      main.ts          bootstrap
      app.module.ts    root module
      users/           one folder per Nest module: <name>.module.ts, .service.ts, .spec.ts, resolver/DTOs
      bottles/
    test/              e2e tests (*.e2e-spec.ts) + jest-e2e.json
  web/                 Next.js App Router
    src/app/           routes (page.tsx, layout.tsx), import alias @/* -> src/*
    src/components/    UI components, PascalCase exports
    public/            static assets
packages/
  shared/              shared validation limits (spec 1)
context/               specs and AI context
```

Today the api has only the scaffold files (`app.controller/service/module.ts`) at the `src/` root. `users/`, `bottles/` and `packages/shared/` are created in spec 1.

## Naming

- Components: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)
- api files: kebab-case with a role suffix (`bottles.service.ts`, `bottles.resolver.ts`)
- web files: Next conventions (`page.tsx`, `layout.tsx`, `route.ts`)

## Formatting

Run the formatter and don't hand-format. Now: api uses Prettier (single quotes, trailing commas), web uses Biome (2-space indent, double quotes, organized imports). Spec 1 moves both to one root Biome config.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Git workflow
- `main` holds only the initial scaffold commit. Never commit feature work to `main`.
- All work goes to the integration branch `feat/wine-cellar`.
- Each spec gets its own branch from `feat/wine-cellar`, named `spec/<n>-<name>` (e.g. `spec/2-api-data`).
- `/feature complete` merges the spec branch into `feat/wine-cellar`, NOT into `main`, with `--no-ff` so every spec stays visible in history, then pushes `feat/wine-cellar`.
- Spec branches stay local: never push them, delete each one after its merge.
- Never merge `feat/wine-cellar` into `main`. The deliverable is an OPEN pull request `feat/wine-cellar -> main`.
- Review scope on a spec branch: `git diff feat/wine-cellar --name-only` (for /feature review and code-scanner).
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`), English, imperative mood, one logical change per commit. No "wip" or "fix again" commits.
- Never commit `.env` or `CLAUDE.local.md`; only `.env.example`.
- Never force-push. Never change git config or author identity.

## Language
- The user writes in Ukrainian. Reply in Ukrainian in chat.
- Everything that lands in the repo is in English: code, comments, specs, docs, commit messages, PR description.

## Pull request
- Open the PR only when every spec is complete and `npm run lint && npm run typecheck && npm test` pass from the repo root.
- Title: `feat: Mini Wine Cellar`.
- Write the description to `PR.md` with these sections: Summary, Key decisions, Assumptions, How to run and test, Screenshots (mobile 375px, desktop 1280px), Next steps.
- Create it with `gh pr create --base main --head feat/wine-cellar --title "feat: Mini Wine Cellar" --body-file PR.md`.
- Do not merge the PR. Do not commit `PR.md` itself.

## Comments
- Comment only the "why": non-obvious decisions and trade-offs. Never restate what the code does.

## Decisions
- Non-obvious decisions live in `docs/decisions.md` (English), numbered `D-<n>` in order. Never renumber or delete an entry; a reversed decision gets a new entry that points to the old one.
- When a spec makes a non-obvious decision, add an entry on `/feature complete`, in this format:

```markdown
## D-<n>: <decision in one line>
- Context: why the question came up
- Decision: what we do
- Alternatives: what else was considered
- Why: the reason in 1-2 sentences
```

- `PR.md` "Key decisions" links to `docs/decisions.md` and does not repeat it.

## Errors
- No try/catch that only logs. Throw Nest exceptions (NotFoundException, BadRequestException) and let them become GraphQL errors.
- Catch only where the code can recover or translate the error.

## Scope
- Implement only what the current spec asks. No speculative helpers, abstractions or "for later" code.

## Consistency
- kebab-case file names. One Nest module per domain in apps/api (users, bottles).
- UI components in apps/web/src/components with PascalCase exports.
- Validation limits come from packages/shared in both apps.
