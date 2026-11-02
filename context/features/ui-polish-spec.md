# UI Polish Phase 1 - Demo Data, Card Details, Toast and Favicon

## Overview

Spec 7 (`spec/7-ui-polish`). Runs after spec 5 and BEFORE spec 6 (delivery), so the README screenshots show the finished UI. Seeds demo bottles for Anna, polishes the bottle card and the header, adds a success toast and a favicon, and takes the two spec 5 optional items (skeleton cards, retry).

## Requirements

### Demo data in the seed

- `DatabaseSeeder` adds 5-6 demo bottles for Anna with fixed uuids (same style as the user ids), through `em.upsertMany(Bottle, ...)` keyed on `id`. A second `npm run db:seed` creates no duplicates and leaves bottles added through the UI untouched (only rows with the demo ids are written).
- The bottles differ in vintage (spread across decades), region (several countries) and `likesCount` (0 to 5: only the owner can like, D-1).
- Each demo bottle has an explicit `createdAt` in the past, one apart from the next, so their order is fixed and a bottle added through the UI always lands above them.
- Photos only from sources that allow free use and hotlinking: Unsplash (`images.unsplash.com`, Unsplash License) or Wikimedia Commons (`upload.wikimedia.org`, public domain, CC0 or CC BY / CC BY-SA with attribution). Next to each URL in the code: the source page and the license (and author when the license asks for attribution).
- Every photo URL passes our own validation: `https://`, no credentials, a hostname with a TLD, at most 2048 chars. One demo bottle has no photo, so the placeholder shows.
- Mark and Taras get no bottles, so their cellar shows the empty state.
- The demo data lives in its own module (`demo-bottles.ts`), and a unit test runs every entry through the `AddBottleInput` validation (class-validator) and expects no errors. The test fails if a later edit breaks a URL or a limit.
- A reseed resets every demo bottle to its seed values, `likesCount` included: the seed defines one canonical demo state, the same for screenshots, the video and the reviewer. Bottles added through the UI are never touched.
- Decision entry in `docs/decisions.md` (next free number, D-29): demo bottles in the seed, fixed ids with upsert, owner Anna only, photo sources and licenses, and the reseed resetting demo likes to their seed values (canonical demo state) while UI-added bottles stay untouched.

### Bottle card

- Vintage as a shadcn `Badge` (`npx shadcn add badge`).
- Region with a lucide `MapPinIcon` in front (icon `aria-hidden`, the text stays readable by screen readers).
- Producer stays visible under the name.
- Like button: heart icon plus count, with a short scale ("pop") animation on every click, including rapid repeated clicks. No animation under `prefers-reduced-motion: reduce` (Tailwind `motion-safe:` / `motion-reduce:` variants). The optimistic count, rollback and the inline error under the card stay as they are.

### Toast

- shadcn Sonner (`npx shadcn add sonner`), one `<Toaster />` rendered in `providers.tsx`.
- `toast.success("Bottle added")` after a successful `addBottle` only.
- Errors stay where they are: field errors under the fields, other server errors in the inline alert above the form, like errors on the card. No error toasts.

### Header and metadata

- lucide `WineIcon` next to the app name in the header (`aria-hidden`).
- Favicon from `apps/web/src/app/icon.svg`: a simple wine glass in the `--primary` color. Delete the scaffold `apps/web/src/app/favicon.ico`, so the browser does not pick it over the SVG.
- `metadata` in `layout.tsx` keeps `title` "Mini Wine Cellar" and gets a `description` that matches the product (personal list of bottles, add and like).

### From spec 5 Optional

- Loading state: skeleton cards (`npx shadcn add skeleton`) in the same grid and shape as `BottleCard` (4:3 photo area, title, text lines, button) instead of the "Loading..." text. The list region keeps an accessible busy/loading hint.
- Error state: a "Try again" button next to the error message that calls `refetch()`. The button is disabled (or shows progress) while the refetch runs. Cached bottles stay visible on a failed refetch, as now.

### Packages and docs

- After every `shadcn add` / `npm install`: `npm run format`, then `npm ls --all` shows no missing packages, and the only invalid ones are the three known entries: `ajv-formats` (optional peer of `@hookform/resolvers`), `@apollo/server` (peer of the playground plugin, D-19) and `webpack` (peer of `schema-utils`, D-31); see `AGENTS.md`. With `legacy-peer-deps`, add any peer a new package needs to `apps/web/package.json` yourself.
- `AGENTS.md`: record the new packages and versions (sonner, anything `shadcn add` installs) and any API note worth keeping.
- `context/project-overview.md`: UI / UX section mentions the toast, the card details and the demo data.

## Files to Create / Change

1. `apps/api/src/seeders/demo-bottles.ts`, `apps/api/src/seeders/demo-bottles.spec.ts`, `apps/api/src/seeders/database.seeder.ts`
2. `apps/web/src/components/ui/{badge.tsx,skeleton.tsx,sonner.tsx}` (shadcn CLI)
3. `apps/web/src/components/{bottle-card.tsx,like-button.tsx,bottle-list.tsx,add-bottle-form.tsx,providers.tsx,app-header.tsx}`
4. `apps/web/src/app/{icon.svg,layout.tsx,globals.css}`; delete `apps/web/src/app/favicon.ico`
5. `apps/web/package.json`, `package-lock.json`
6. `docs/decisions.md`, `AGENTS.md`, `context/project-overview.md`

## Notes

Use Context7 for the installed shadcn CLI, Sonner, lucide-react, Tailwind CSS 4 and MikroORM 6 versions.

- `upsertMany` in MikroORM 6: check the `onConflictFields` / `onConflictAction` / `onConflictMergeFields` options. Conflict on `id`, action merge, and the merged fields include `likesCount` (decided: a reseed resets demo likes).
- `createdAt` has no initializer and defaults to `now()` in the database. Pass explicit dates for the demo rows; all of them in one insert would otherwise share the same timestamp and sort only by id.
- Check every photo URL before committing: `curl -sI <url>` returns 200 with an `image/*` content type. Prefer sized Unsplash URLs (`?w=800&q=80` or similar) to keep the cards light.
- shadcn's `sonner.tsx` may import `useTheme` from `next-themes`. The app has a light theme only, so drop that import and pass `theme="light"` rather than adding `next-themes`. Check what `shadcn add sonner` writes and installs in CLI 4.23.
- lucide-react 1.66 exports icons with the `Icon` suffix (`HeartIcon`, `MapPinIcon`, `WineIcon`), as the existing code does.
- Like animation: re-trigger it on every click (e.g. bump a `key` on the icon, or restart the animation class), not only on the first. Define the keyframes in `globals.css` (`@theme` `--animate-*`) or use `tw-animate-css` utilities.
- SVG favicons cannot read CSS variables: write the `--primary` color (`oklch(0.42 0.15 15)`) as a literal in `icon.svg` (hex if a browser renders oklch wrong in favicons).
- Apollo Client 4: check whether `useQuery` reports `refetch` progress by default (`notifyOnNetworkStatusChange`, `networkStatus`) before wiring the retry button's busy state.
- Run `npm run db:seed` twice in testing to prove the upsert.

## Testing

1. `npm run db:seed` twice: Anna has the demo bottles once, no duplicates; a bottle added through the UI before the second seed is still there and still on top; a demo bottle liked before the second seed is back to its seed count
2. As Anna: the cards show photo (or the placeholder on the bottle without one), name, producer, vintage badge, region with the pin icon and the like count; all photos load (no broken images in the console)
3. Click like several times quickly: the heart pops on every click and the count goes up at once; with reduced motion emulated (DevTools Rendering) there is no animation
4. Add a valid bottle: the "Bottle added" toast shows, the bottle is on top. Submit an empty form: errors under the fields, no toast
5. As Mark and Taras: the empty state
6. Throttle the network (or slow the api): skeleton cards show while loading. Stop the api and reload: the error with "Try again"; start the api and click it: the list loads
7. Browser tab shows the wine-glass favicon and the title "Mini Wine Cellar"; the page source has the description meta
8. Screenshots through Playwright MCP at 375x812 and 1280x800: Anna with the list, Mark with the empty state, the form with validation errors. Show them to the user in the chat before `/feature complete` (not committed; spec 6 takes the README ones)
9. `npm run lint && npm run typecheck && npm test && npm run build` from the root: all green; `npm ls --all` clean apart from the three known invalid entries (`ajv-formats`, `@apollo/server`, `webpack`)
## References

- shadcn Badge: https://ui.shadcn.com/docs/components/badge
- shadcn Sonner: https://ui.shadcn.com/docs/components/sonner
- shadcn Skeleton: https://ui.shadcn.com/docs/components/skeleton
- Next.js app icons (`icon.svg`): `node_modules/next/dist/docs/` (metadata files, app icons)
- Tailwind `motion-safe` / `motion-reduce`: https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion
- MikroORM upsert: https://mikro-orm.io/docs/entity-manager#upsert
- Unsplash License: https://unsplash.com/license
- Wikimedia Commons reuse: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia

## Optional (only if time is left)

- Fade-in for newly added cards (also off under reduced motion).
