# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification
- Language rules: see Language in @context/coding-standards.md

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create `spec/<n>-<name>` from `feat/wine-cellar`
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works (browser for UI, curl or a test for APIs). Add/maintain unit tests for the logic you touch, see [Testing](#testing). Run the typecheck from CLAUDE.md and fix any errors. Run the build before `/feature complete`
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after typecheck and tests pass and everything works
7. **Merge** - `/feature complete` merges into `feat/wine-cellar` with `--no-ff` and pushes `feat/wine-cellar`. Never touch `main`
8. **Delete Branch** - Delete the local spec branch after merge (spec branches are never pushed)
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until typecheck and tests pass. If they fail, fix the issues first.

## Branching

Every spec gets its own branch from `feat/wine-cellar`, named **spec/<n>-<name>** (e.g. `spec/2-api-data`). Full rules: Git workflow in @context/coding-standards.md.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase
- Don't add dependencies without asking
- Never read or print .env values

## Testing

<!-- /bootstrap adapts this section to the real test runner, config and mocking style. -->

**api (`apps/api`)**: Jest 30 + ts-jest, Node environment. Config: `apps/api/jest.config.ts` (unit) and `apps/api/test/jest-e2e.json` (e2e).

- **Scope: business logic and utilities.** Services, validation, pure helpers. Resolvers only for input mapping and error translation.
- Unit tests sit next to the code as `*.spec.ts` under `src/`. e2e tests go in `test/*.e2e-spec.ts` and use supertest against the Nest app.
- Keep unit tests true units: **no real database, network or auth**. Build the unit with `Test.createTestingModule(...)` from `@nestjs/testing` and replace collaborators with `{ provide: X, useValue: mock }`. Use `jest.fn()` / `jest.mock(...)` for modules.
- Cover the happy path plus the expected failures (invalid input, not found, conflict, unauthorized).
- Jest globals (`describe`, `it`, `expect`) are enabled through `types: ["jest"]` in `tsconfig.json`, so no imports are needed.

**web (`apps/web`)**: Jest via `next/jest` (added in spec 1; the brief requires Jest, so not Vitest). Scope: helpers, Zod schemas, form logic. Co-located `*.test.ts`. No component/UI tests unless asked. Until spec 1 lands there is no runner.

**Shared (`packages/shared`)**: test the validation limits wherever spec 1 wires Jest for it.

Run the tests (`npm test -w api` now; root `npm test` after spec 1) and both typechecks before committing.

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
