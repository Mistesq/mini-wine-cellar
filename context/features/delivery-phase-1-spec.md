# Delivery Phase 1 - README, Screenshots and Pull Request

## Overview

Spec 6 (`spec/6-delivery`). Makes the repo ready to hand over: a root README that runs from a clean clone, written answers, screenshots at mobile and desktop width, a final scan and full check, and the open pull request `feat/wine-cellar -> main`.

## Requirements

- Root `README.md`: what the app does, the stack, prerequisites ("Node 22.13+ or 24+ (`engines` `^22.13.0 || >=24.0.0`, tested on 24 and 26)", npm 10+, Docker), and the run flow `npm install` -> `docker compose up -d` -> `npm run db:migrate` -> `npm run db:seed` -> `npm run dev`, with the URLs (web 3000, GraphQL 4000/graphql).
- README sections for env files (copy the `.env.example` files), scripts (`lint`, `typecheck`, `test`, `build`, `codegen`, `db:*`), the fake login and how ownership is enforced, the project layout, and a link to `docs/decisions.md`.
- README build step: before `npm run build`, copy `apps/web/.env.example` to `apps/web/.env.local`. A production build without `NEXT_PUBLIC_API_URL` fails on purpose ("NEXT_PUBLIC_API_URL must be set when NODE_ENV is production", D-26); `npm run dev` needs no env file.
- README "Troubleshooting" section: (1) port 5432 already taken by a local Postgres (stop it or change the host port in `docker-compose.yml` and `DATABASE_URL`); (2) on Windows, node processes left on ports 3000/4000 after stopping `npm run dev` (find them with `netstat -ano | findstr :3000` and end them with `taskkill /PID <pid> /T /F`); (3) `EPERM: operation not permitted, rename ... .next\dev\...` from `next dev` right after `next build` (stop dev, delete `apps/web/.next`, start again).
- README "How I worked": 2-3 paragraphs on what `.claude/` (skills, agents, settings) and `context/` (overview, specs, standards) hold, and how the work went: overview -> specs -> one `/feature` loop per spec (load, start, test, review, complete) -> code review and code-scanner before each merge.
- `ANSWERS.md` at the root with the answers to the 5 written questions. The user provides the texts; do not write them. Linked from the README and `PR.md`.
- Clean-clone check: a fresh clone in a temp dir with `docker compose down -v` first. The README steps alone bring the app up with no extra command.
- Screenshots at 375px and 1280px (cellar with a few bottles) saved to `docs/screenshots/` and linked in the README.
- Before the PR: run code-scanner on every file from `git diff main...feat/wine-cellar --name-only` and `/cleanup check`; fix the findings. Then `npm run lint && npm run typecheck && npm test && npm run build` pass from the root.
- `CLAUDE.md`: the one-line product description and the final Commands; `AGENTS.md`: every installed version recorded; `context/project-overview.md` Status updated.
- `PR.md` with Summary, Key decisions, Assumptions, How to run and test, Screenshots, Next steps (pagination, edit/delete, real auth via Cognito, CI, e2e tests), plus a link to `ANSWERS.md`. Key decisions links to `docs/decisions.md` with one line per entry and does not repeat it. Open the PR with `gh pr create`. `PR.md` is not committed and the PR is not merged.

## Files to Create / Change

1. `README.md` (root)
2. `ANSWERS.md` (root, texts from the user)
3. `docs/screenshots/{mobile-375.png,desktop-1280.png}`
4. `CLAUDE.md`, `AGENTS.md`, `context/project-overview.md`, `docs/decisions.md` (only if this spec adds a decision)
5. `PR.md` (gitignored, not committed)

## Notes

- Take the screenshots with Playwright MCP (`browser_resize` to 375x812 and 1280x800) against the seeded app.
- Ask the user for the `ANSWERS.md` texts at the start of the spec, so the PR is not blocked at the end.
- The PR opens only after every spec is merged into `feat/wine-cellar` and pushed. Never merge into `main`, never force-push.

## Testing

1. Fresh clone in a temp dir, follow the README word for word: the web app on 3000 shows the 3 users, adding and liking work
2. code-scanner and `/cleanup check` report nothing left to fix
3. `npm run lint && npm run typecheck && npm test && npm run build` from the root (with `apps/web/.env.local` copied as the README says): all green
4. Without `apps/web/.env.local`, `npm run build` fails with the `NEXT_PUBLIC_API_URL` message, as the README warns
5. Open the README on GitHub: screenshots render, links to `ANSWERS.md` and `docs/decisions.md` work
6. `gh pr view --web`: the PR `feat: Mini Wine Cellar` is open, base `main`, head `feat/wine-cellar`, the body has all six sections and the `ANSWERS.md` link

## References

- gh pr create: https://cli.github.com/manual/gh_pr_create
- Playwright MCP: https://github.com/microsoft/playwright-mcp

## Optional (only if time is left)

- A third screenshot `docs/screenshots/form-errors-375.png`: the form with validation errors at 375px.
