<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# A7 Property agent guide

This file is the durable handoff for agents working in this repository. Read it before changing code. When this file conflicts with older product/design documents, the running source and the rules below are the current contract.

## Product and scope

A7 Property is a mobile-first Myanmar property marketplace frontend. It supports home discovery, rent/buy search, property details, saving and comparing homes, inquiries/viewings, device-local messages, a seeker dashboard, owner/agent CRM demos, and a deterministic home-matching assistant.

- This repository is currently a **frontend demo**, not a production backend.
- Do not invent APIs, databases, real authentication, payments, uploads, analytics, or live AI unless the user explicitly expands the scope.
- Keep simulated actions honest in the UI. Social sign-in, messaging, viewing requests, listing edits, and the assistant must remain labelled or presented as browser/device-local demo behavior.
- Verification copy must reflect each record's actual `verification_status`; never imply that every listing is verified.
- The user normally communicates in Myanmar. Reply in Myanmar when they do, while keeping technical names/commands in English where clearer.

## Runtime stack

- Node.js 22
- Next.js 16 App Router + React 19 + strict TypeScript
- Tailwind CSS 4, source-owned UI primitives, Base UI, Framer Motion
- Leaflet/React Leaflet for maps
- vinext/Vite for Cloudflare Sites builds
- Capacitor for the optional Android wrapper
- Local mock data and browser storage; no active D1/R2/database binding

Read the relevant local Next.js guide under `node_modules/next/dist/docs/` before using or changing a Next API. This project deliberately follows the installed Next 16 behavior, including `next/image`'s `preload` API rather than deprecated `priority` usage.

## Quick commands

```bash
npm run dev:next          # Next dev server at http://localhost:3000
npm run dev               # vinext/Cloudflare-compatible dev mode
npm run lint              # ESLint
npx tsc --noEmit          # strict type check
npm test                  # Cloudflare production build + all Node regression tests
npm run build:cloudflare  # production Sites artifact in dist/
npm run android:apk       # optional Android debug APK flow
```

Do not run both development servers on the same port. Never edit generated `.next/` or `dist/` output by hand.

## Route map

Public routes:

- `/` — home discovery
- `/search` — rent/buy filtering and results
- `/properties/[id]` — server-resolved property detail
- `/compare` — device-local comparison, maximum four homes
- `/assistant` — deterministic browser-based matching demo
- `/community`, `/help`, `/privacy`, `/terms`, `/sign-in`

Auth-bound demo routes:

- Seeker: `/dashboard`, `/saved`
- Lister: `/owner`, `/agent`
- Either signed-in role: `/messages`, `/profile`

`RequireAuth` owns route guarding and saves the requested URL in `sessionStorage` under `a7-auth-return-to`. Keep redirects replace-based so the sign-in page does not pollute browser history. Account roles are `seeker` and `lister`; signing in again with a selected role must update the stored role.

## Architecture boundaries

- `app/*` — route entries, metadata, server selection, sitemap/robots, global providers
- `components/layout/*` — headers, navigation, shells, route transitions
- `components/mobile/*` — primary mobile discovery/saved/messages/profile journeys
- `components/property/*` — cards, galleries, details, maps, inquiry flows
- `components/search/*` — search state, filters, cards, map/list controls
- `components/dashboard/*` — seeker dashboard and owner/agent CRM
- `components/assistant/*` — assistant UI and recommendations
- `components/ui/*` — reusable source-owned primitives
- `components/i18n/*` — shared language state and switcher
- `components/auth/*` — device-local demo identity and guards
- `lib/properties.ts` — client-safe property types, formatters, filters, and sort helpers
- `lib/property-catalog.ts` — full JSON catalog and record lookup
- `lib/local-storage.ts` — resilient storage helpers and cross-component change events
- `data/properties.json` — canonical 100-record mock property catalog
- `public/data/properties.json` — public synchronized catalog copy
- `tests/*` — rendered HTML and source regression contracts

Prefer server components for route data selection and metadata. Add `"use client"` only where browser state, storage, events, or interaction requires it. Pass the smallest serializable dataset from a server route into a client view.

Do not import `lib/property-catalog.ts` from a broadly shared client utility or a global component. The catalog adds roughly 91 KB before compression. Keep pure helpers in `lib/properties.ts`; pass route-specific records into client hooks/components. The search route must not regain a client-side catalog chunk.

Root provider order in `app/layout.tsx` is intentional:

```text
LanguageProvider
  AuthProvider
    ToastProvider
      route content
      ComparisonTray
      MobileBottomNav
```

The global `MobileBottomNav` must stay hidden on `/dashboard`, because the seeker dashboard supplies its own mobile journey navigation. CRM mobile navigation prioritizes Overview, Properties, Messages, Verification, and Settings.

## Language and Myanmar typography contract

The user's supplied Myanmar face is the required font for **all Myanmar UI text**.

- Font asset: `public/fonts/z06-walone-bold.ttf`
- CSS family: `Z06 Walone`
- Source of truth: `app/globals.css`
- The supplied file is a bold face and must remain declared as `font-weight: 700`; do not fake a `400 900` variable range.
- When the shared language is Myanmar, `html[lang="my"]` switches display/text variables and semantic text controls to Walone.
- Keep Myanmar letter spacing at zero and allow taller line height. Compact 8–11 px utilities are deliberately raised to a readable size in Myanmar mode.
- Use `useLanguage()` and `tx(english, myanmar)` for interactive copy. Do not create a page-local language state that can disagree with the global switcher.
- `LanguageProvider` persists `a7-property-language` and updates the document `lang` attribute.

`docs/design-system.md` still contains an older Noto Sans Myanmar/Jade direction. For implemented typography and colors, `app/globals.css` overrides that legacy document. Do not remove the Noto fallback packages without verifying fallback glyph coverage.

## Device-local state contract

There is no server account state. `AuthProvider` stores the demo user under `a7-auth-user`. Favorites, comparisons, recent homes, conversations, viewings, profile preferences, and CRM drafts use the keys centralized in `lib/local-storage.ts`.

- Reuse `readStoredIds`, `writeStoredIds`, `readStoredJson`, and `writeStoredJson`.
- Do not access duplicate ad-hoc keys when a centralized key exists.
- Storage helpers intentionally fall back to in-memory state in restricted browsers.
- Preserve the `a7:stored-ids-change` and `a7:stored-json-change` events so separate client components synchronize without a global state library.
- Mock social sign-in must always create a nonblank deterministic demo email; it must not make an external OAuth request.

## UI, accessibility, and performance rules

- Design for 320 px and wider, with mobile as the primary journey.
- Interactive controls need visible focus and at least a 44×44 px touch target.
- Keep the root skip link, `#main-content`, one clear route H1, meaningful image alt text, dialog semantics, and reduced-motion behavior.
- Use both text/icon and color for verification or status; color alone is insufficient.
- Use `ProgressiveImage` for property imagery. Preload only the true first/LCP image; lazy-load repeated cards.
- Avoid full-page spinners where shaped skeletons or server-rendered content are available.
- Preserve transparent demo language: the assistant is rule-based, form submissions are device-local, and unavailable backend behavior must not look real.

## Testing and definition of done

For ordinary code changes, run at least:

```bash
npx tsc --noEmit
npm run lint
npm test
git diff --check
```

`npm test` first creates the vinext production build and then runs `tests/*.test.mjs`. Rendered HTML tests rely on that fresh `dist/` build. Add a focused regression test when fixing navigation, auth return paths, language/font behavior, catalog bundle boundaries, accessibility structure, or any previously observed bug.

A frontend change is done only when:

1. Mobile and desktop flows remain coherent.
2. English/Myanmar state stays synchronized.
3. Demo claims remain truthful.
4. Type check, lint, production build, and tests pass.
5. No unrelated user changes are overwritten.
6. Deployable changes are published when the user requested a live update.

## Sites hosting

This repository contains `.openai/hosting.json`, so use the installed Sites building and hosting skills for any deployment.

- Existing project ID: `appgprj_6a8ac269be0c8191b9683dd3e6893c73`
- Production URL: `https://a7-property-myanmar.ltunk36.chatgpt.site`
- Build with `npm run build:cloudflare`/`npm test`.
- Commit the exact validated source, push that commit to the Sites repository, package the successful build with the Sites `package-site.sh` helper, save a version, then deploy the saved version.
- Never expose or persist short-lived repository credentials or bypass tokens.
- Never change site access implicitly. Public access means anyone with the URL can visit and requires an explicit user approval after explaining that exposure.
- Treat Sites project/version/deployment IDs as opaque values; copy them exactly.

## Working safely

- Preserve the auto-generated Next.js block at the top of this file.
- The worktree may contain user changes. Inspect `git status` and relevant diffs before editing; do not reset or overwrite unrelated work.
- Prefer focused patches and existing primitives over parallel duplicate components.
- Consult `docs/frontend-architecture.md`, `docs/product-blueprint.md`, and `docs/a7-property-brand-system.md` for intent, but validate all claims against current source and tests because some documents describe earlier or aspirational milestones.
- Do not rename public property IDs, storage keys, the hosting project, or the production URL without an explicit migration request.
