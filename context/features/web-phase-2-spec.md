# Web Phase 2 - Cellar: Add Form, List and Optimistic Like

## Overview

Spec 5 (`spec/5-web-cellar`). Builds the cellar UI for the chosen user: the add-bottle form with Zod + react-hook-form, the bottle list with all its states, and the like button with an instant optimistic count.

## Requirements

- Zod schema `addBottleSchema` with limits from `@mini-wine-cellar/shared` and clear messages ("Name is required", "Vintage must be between 1900 and <current year>", "Photo URL must start with https://"). Strings trimmed; empty photoUrl becomes `undefined`; max vintage from `getMaxVintage()` at validation time.
- `AddBottleForm`: react-hook-form with `zodResolver`, errors under each field (shown on submit, then on change), disabled submit while sending, server errors in an inline alert, form reset on success.
- `addBottle` updates the cache by prepending the new bottle to `myBottles`, with no refetch.
- `BottleList` runs `myBottles` with loading (plain "Loading..." text), empty ("Your cellar is empty") and error (message) states.
- `BottleCard`: photo with a fixed aspect ratio and a placeholder when the URL is missing or fails to load; name, producer, vintage, region, like count.
- `LikeButton`: `likeBottle` with `optimisticResponse` (`likesCount + 1`); Apollo rolls back on error and the card shows the error. No toggle, rapid clicks each count.
- Layout: at 375px one column, form above the list, tap targets of at least 44px. At 1280px the form is in a side column and the list is a card grid.
- Jest tests for `addBottleSchema`: a valid input, each field invalid, the vintage bounds, https only, trimming, empty photoUrl.
- Remove the temporary `--passWithNoTests` from the web `test` script (added in spec 1), now that `addBottleSchema` has tests.
- Declare `"@mini-wine-cellar/shared": "*"` in the web `dependencies` once it imports shared (the api does since spec 3). Without it the import resolves only through the hoisted workspace symlink, which `.npmrc` `legacy-peer-deps` and hoisting changes can break.

## Files to Create

1. `apps/web/src/lib/add-bottle-schema.ts`, `apps/web/src/lib/add-bottle-schema.test.ts`
2. `apps/web/src/graphql/bottles.ts` - `myBottles`, `addBottle`, `likeBottle` documents (then `npm run codegen -w web`)
3. `apps/web/src/components/{add-bottle-form.tsx,bottle-list.tsx,bottle-card.tsx,like-button.tsx}`
4. `apps/web/src/app/page.tsx` - cellar layout for the chosen user

## Notes

Use Context7 for the installed Zod, react-hook-form and `@hookform/resolvers` versions.

- Zod 4: custom messages use `{ error: "..." }` (not `message`), and the URL validator is top-level `z.url()` with a protocol option. Check the resolver version that supports the installed Zod major.
- Do not freeze the year: build the vintage check with `refine` / a function, not `.max(getMaxVintage())` at module load.
- Number input: use `valueAsNumber` (or a coerce step) so the schema input and output types line up with `useForm`.
- The optimistic response must match the mutation selection exactly (`__typename`, `id`, `likesCount`).
- Plain `<img>` (A11): suppress Biome `noImgElement` only on that element, with `// biome-ignore lint/performance/noImgElement: photos come from arbitrary domains`. Check the rule's group name in Biome 2.4.
- Apollo Client 4 hooks come from `@apollo/client/react`.

## Testing

1. As Anna, submit an empty form: messages appear under name, producer, vintage, region
2. Enter vintage 1800 and photo `http://x.com/a.jpg`: the vintage-range and https messages appear
3. Add a valid bottle: it appears at the top with no reload and the form resets; Network shows no `myBottles` refetch
4. Click like 3 times quickly: the count goes up on every click at once; after a reload it stays the same
5. Stop the api and click like: the count rolls back and the card shows an error
6. Switch to Mark: Anna's bottles are gone, the empty state shows
7. Check 375px and 1280px: no horizontal scroll, the grid and the side form at desktop width
8. `npm test`, `npm run typecheck`, `npm run lint` pass

## References

- react-hook-form `useForm`: https://react-hook-form.com/docs/useform
- Resolvers: https://github.com/react-hook-form/resolvers
- Zod API and error customization: https://zod.dev/api, https://zod.dev/error-customization
- Apollo optimistic UI: https://www.apollographql.com/docs/react/performance/optimistic-ui
- Apollo cache updates after mutations: https://www.apollographql.com/docs/react/data/mutations#updating-the-cache-directly

## Optional (only if time is left)

- Skeleton cards instead of the "Loading..." text.
- A retry button in the error state that calls `refetch`.
