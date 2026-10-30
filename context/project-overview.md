# Mini Wine Cellar Project Specifications

## Problem (Core Idea)

## Users

## Core Features

## Data Model (rough draft)

## Tech Stack

npm workspaces monorepo (npm 10, Node 24). "Planned" items arrive with spec 1 and are not installed yet.

| Area | Now | Planned (spec 1) |
| --- | --- | --- |
| Web (`apps/web`) | Next.js 16.4 App Router, React 19.3, Tailwind CSS 4.3, TypeScript 5.9, port 3000 | Zod + react-hook-form for forms; calls the API through `NEXT_PUBLIC_API_URL` |
| API (`apps/api`) | NestJS 12.3 on Express 5, TypeScript 6.0 | Port 4000, GraphQL at `/graphql` (driver TODO), CORS for `http://localhost:3000`, class-validator + global `ValidationPipe` |
| Shared (`packages/shared`) | `packages/*` declared, empty | Shared validation limits used by both apps |
| Database / ORM | none | PostgreSQL via docker-compose, MikroORM with migrations |
| Auth | none | Fake: `x-user-id` header checked by a Nest guard (details in this overview, TODO) |
| Lint / format | Biome 2.4 (web); oxlint + Prettier (api) | One Biome at the root for all workspaces, `noExplicitAny: error`; oxlint and Prettier removed |
| Tests | Jest 30 + ts-jest + supertest (api); none (web) | Jest via `next/jest` in web |
| Root scripts | none (`test` is a failing placeholder) | `dev`, `test`, `lint`, `typecheck` via workspaces; typecheck runs each app's own TypeScript |
| CI / deploy | none | TODO |

## Architecture Notes

## Monetization (if any)

## UI / UX

## Roadmap

## Status

## Assumptions

## Open Questions
