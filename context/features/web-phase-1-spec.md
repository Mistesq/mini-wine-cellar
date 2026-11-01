# Web Phase 1 - Apollo Client, Codegen and User Picker

## Overview

Spec 4 (`spec/4-web-foundation`). Connects the web app to the API: shadcn/ui, Apollo Client with an `x-user-id` link, typed operations from GraphQL Codegen, and the fake login dropdown in the header. The cellar itself comes in spec 5.

## Requirements

- Init shadcn/ui for Tailwind v4 and add Button, Input, Label, Card, Select. Light theme, neutral palette with a wine-red accent token in `globals.css`.
- GraphQL Codegen with the client preset: schema from `../api/schema.gql` (the file, not the server), documents from `src/**/*.{ts,tsx}`, output in `src/gql/` (committed, excluded from Biome). A `codegen` script in web.
- Apollo Client created once on the client. `HttpLink` to `NEXT_PUBLIC_API_URL`, plus a link that adds `x-user-id` from the stored user at request time and sends nothing when no user is chosen.
- Stored user: a small store over `localStorage` read through `useSyncExternalStore` (server snapshot `null`), so SSR and hydration match. Switching users clears the Apollo store.
- Header: app name and a user Select filled by the `users` query, with loading and error states. The choice survives a reload.
- `/` shows "Choose a user to open the cellar" when no user is chosen, otherwise a placeholder with the user's name. Mobile-first layout shell (header, main container).

## Files to Create

1. `apps/web/components.json`, `apps/web/src/lib/utils.ts`, `apps/web/src/components/ui/*` (shadcn)
2. `apps/web/codegen.ts`, `apps/web/src/gql/*` (generated)
3. `apps/web/src/lib/apollo-client.ts`
4. `apps/web/src/lib/current-user-store.ts`
5. `apps/web/src/components/{providers.tsx,app-header.tsx,user-picker.tsx}`
6. `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`

## Notes

Read `apps/web/AGENTS.md` and the installed Next docs. Use Context7 for the installed Apollo Client, Codegen and shadcn versions.

- Apollo Client 4 moved the React hooks and provider to `@apollo/client/react` and has `rxjs` as a peer; the context link API changed too (`SetContextLink`). Check before writing the links.
- No `@apollo/client-integration-nextjs`: the cellar is client-rendered (A7). Create the client inside a `"use client"` provider (e.g. `useState`), never as a module singleton shared across server renders.
- The client preset's `graphql()` returns `TypedDocumentNode`; hooks infer types from it with no manual generics.
- shadcn writes kebab-case files under `src/components/ui`; run `npm run format` on them so root Biome passes.
- Do not read `localStorage` during render or in a module scope: the server render has no `window`.

## Environment Variables

```
NEXT_PUBLIC_API_URL=
```

## Testing

1. `npm run codegen -w web` regenerates `src/gql` with no diff
2. With the api running, open http://localhost:3000: the header lists Anna, Mark, Taras
3. Pick Mark and reload: Mark stays selected; DevTools Network shows `x-user-id` on GraphQL requests
4. Stop the api and reload: the picker shows an error state, the page does not crash
5. Check widths of 375px and 1280px: the header fits, no horizontal scroll
6. `npm test`, `npm run typecheck`, `npm run lint` pass; no hydration warnings in the console

## References

- Next.js installed docs: `node_modules/next/dist/docs/`
- shadcn/ui with Next and Tailwind v4: https://ui.shadcn.com/docs/installation/next, https://ui.shadcn.com/docs/tailwind-v4
- Apollo Client: https://www.apollographql.com/docs/react/, links: https://www.apollographql.com/docs/react/api/link/introduction
- Codegen client preset: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client
- `useSyncExternalStore`: https://react.dev/reference/react/useSyncExternalStore

## Optional (only if time is left)

- Extract the header building into `src/lib/auth-headers.ts` with a Jest test (`auth-headers.test.ts`): no user -> no header, user -> `x-user-id`.
- A stored id that is no longer in `users` (e.g. after a reseed with other ids) resets to "no user".
