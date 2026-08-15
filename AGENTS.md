# Lighting & Power — Agent Instructions

## Purpose

This file is the repository-wide guide for coding agents and automated tools working on the Lighting & Power web application. Read it before changing source code, configuration, database behavior, API routes, or user-facing content.

## Project overview

- Framework: Next.js 16 with the App Router.
- Language: TypeScript with strict mode enabled.
- Runtime: React 19 and Node.js.
- Styling: global CSS, SCSS variables/keyframes, Tailwind CSS v4, and Ant Design.
- Data layer: MongoDB through Mongoose.
- Client state: Jotai; server/cache state: TanStack React Query.
- Internationalization: `next-intl`, with Vietnamese and English messages in `src/messages`.
- Media and uploads: Cloudinary; VietMap is used by the map component.
- Rich text: Tiptap.
- Authentication: JWT-based auth with bcrypt password hashing and middleware helpers.

## Non-negotiable rules

1. Preserve all existing functionality unrelated to the requested change.
2. Make the smallest coherent change that solves the request. Do not refactor neighboring code just for style.
3. Never commit secrets. Do not expose values from `.env` or `.env.local`; inspect variable names only when needed.
4. Do not bypass authentication or authorization checks in private/admin routes.
5. Validate and sanitize input at API boundaries. Keep database operations on the server.
6. Do not place server-only imports, secrets, Mongoose models, or database calls in Client Components.
7. Keep both locales working when adding or changing visible text. Add matching keys to `src/messages/en.json` and `src/messages/vi.json`.
8. Do not silently change API response shapes, order status semantics, pricing, cart behavior, or permissions.
9. Avoid destructive database scripts, bulk updates, migrations, or production actions unless explicitly requested.
10. Do not edit generated output such as `.next`, `next-env.d.ts`, or `tsconfig.tsbuildinfo` by hand.

## Repository layout

```text
src/app/                         App Router pages, layouts, and API routes
src/app/[locale]/                Localized customer and admin UI
src/app/api/                     Route handlers
  (public)/                      Public API endpoints
  (private)/                     Authenticated customer endpoints
  (services)/                    Shared server-side service modules
  admin/                         Admin-only endpoints
  auth/                          Authentication endpoints
src/components/                  Reusable UI and editor components
src/config/                      Theme/configuration constants
src/constants/                   Route, menu, and common constants
src/fetch-data/                  Server/data-fetching helpers
src/hooks/                       Reusable React hooks, grouped by user/admin area
src/i18n/                        Locale routing and request configuration
src/lib/                         Database, API, auth, middleware, upload, and utility code
src/messages/                    `en.json`, `vi.json`, and server message helpers
src/models/                      Mongoose schemas/models
src/service/                     External service integrations
src/stores/                      Jotai atoms and client state
src/styles/                      Shared SCSS variables and animations
src/types/                       Shared TypeScript types
scripts/                         Operational scripts such as admin seeding and index sync
public/                           Static images, icons, and other public assets
docs/                             Project design/feature notes
```

Use the `@/*` alias for imports from `src`, for example `@/lib/db`.

## Application architecture

### Rendering and components

- Treat components as Server Components by default.
- Add `'use client'` only when the component needs browser APIs, React state/effects, event handlers, Jotai, React Query, drag-and-drop, or another client-only dependency.
- Keep Client Components focused on interaction and presentation. Fetch protected data through the existing API/data layer rather than importing server internals.
- Check the nearest `layout.tsx` and provider components before changing page behavior.
- Preserve the existing localized route structure: pages live below `src/app/[locale]` and locale-aware navigation should use the project’s `next-intl` setup.

### API routes and services

- Route handlers live in `src/app/api/**/route.ts`.
- Shared server logic belongs in the corresponding file under `src/app/api/(services)` or an appropriate `src/lib` module; avoid duplicating business rules in route handlers.
- Follow the existing patterns in `src/lib/api-handler.ts`, `src/lib/api-client.ts`, and the middleware in `src/lib/middleware`.
- Maintain the distinction between public, authenticated private, admin, and auth endpoints.
- For authenticated routes, use the existing auth middleware/context helpers and verify the acting user owns or may access the requested resource.
- Return consistent status codes and JSON shapes. Inspect neighboring routes before adding a new response format.
- Connect to MongoDB through `src/lib/db.ts`; do not create ad hoc connections in components or individual handlers.
- Reuse existing Mongoose models and types. Be careful with ObjectId conversion, optional fields, pagination, sorting, and indexes.
- For mutations, consider validation, authorization, duplicate submissions, partial failure, and whether caches or client state need invalidation.

### Data and state

- `src/models` defines persistence concerns; `src/types` defines shared application contracts. Keep the two aligned when changing a field.
- `src/fetch-data` is for reusable data loading; React Query hooks under `src/hooks` should own client cache behavior.
- Use Jotai stores for client/UI state that is already modeled there. Do not introduce a second state mechanism for an existing concern.
- When changing products, categories, cart, orders, users, documents, or feedback, inspect the model, type, service/route, hook, store, and affected UI together.
- Preserve cart behavior for both authenticated and guest users, including sync/merge paths.

### Internationalization

- Keep English and Vietnamese message files structurally compatible.
- Use the established `next-intl` APIs and locale-aware links/navigation.
- Do not hard-code user-facing strings in a localized page when the text belongs in messages.
- Be careful with Vietnamese text and encoding; preserve UTF-8 and do not replace real text with mojibake.

### UI and styling

- Reuse existing components, theme values, icons, and styles before adding new ones.
- Preserve responsive behavior and accessibility: labels, keyboard operation, focus states, semantic controls, and useful alt text.
- For admin screens, inspect the surrounding admin layout and related CRUD pages before changing forms, tables, filters, or actions.
- For product and order UI, preserve loading, empty, error, pagination, confirmation, and permission states.
- Use Cloudinary/image configuration already present in `next.config.ts`; do not add unrestricted remote image hosts.

## Environment and security

Environment files exist locally and must remain private. Typical configuration includes database, JWT/auth, Cloudinary, shipping, map, and application URL settings. When adding a variable:

1. Add only the variable name/documentation needed for other developers.
2. Read it on the server unless it is intentionally public and follows the framework’s public-variable convention.
3. Validate missing configuration with a clear server-side error.
4. Never paste actual values into source, documentation, logs, commits, or test fixtures.

Treat uploads, rich text, URLs, user-provided HTML, query parameters, and order/customer data as untrusted input. Preserve the project’s sanitization and authorization behavior.

## Commands and verification

The package scripts currently are:

```bash
npm run dev       # Next dev server on port 4000
npm run build     # Production build and type validation through Next
npm run start     # Start the production build
npm run pretty    # Prettier write for JS/TS/JSON files
npm run seed:admin
npm run db:sync
```

The repository contains both `package-lock.json` and `pnpm-lock.yaml`. Prefer the package manager already used by the task/environment; do not regenerate or delete the other lockfile without an explicit reason.

There is currently no dedicated `test` or `lint` script. For every code change, run the narrowest useful checks, then normally run:

```bash
npx tsc --noEmit
npm run build
```

Use `npm run pretty` only when formatting is part of the change, because it may touch many files. For UI, API, auth, database, upload, or locale changes, also perform a focused manual check when a browser or running backend is available.

## Change workflow

1. Read the relevant page/layout, hook/store, route/service, model, type, and nearby tests/docs before editing.
2. Confirm whether the code runs on the server or client.
3. Implement the smallest change while following existing patterns.
4. Update both locales and related types/contracts when applicable.
5. Inspect the diff for accidental formatting, generated files, secrets, and unrelated changes.
6. Run type/build checks and report any verification that could not be completed.

## Git and handoff

- Do not reset, checkout, clean, or overwrite user changes.
- Do not include unrelated work in a change.
- Summarize changed files, behavior, and verification results.
- Call out assumptions, migration/index requirements, environment changes, or manual checks still needed.
