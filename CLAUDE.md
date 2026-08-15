# CLAUDE.md

This repository is the Lighting & Power e-commerce and content-management application. It is a Next.js 16 App Router project using TypeScript, MongoDB/Mongoose, JWT authentication, `next-intl`, React Query, Jotai, Ant Design, Cloudinary, Tiptap, and VietMap.

## Instructions for Claude

The repository-wide engineering rules are in [`AGENTS.md`](./AGENTS.md). Read and follow that file for every task. In particular, preserve unrelated functionality, protect secrets, keep server and client boundaries correct, maintain both locales, and make focused changes.

Before editing, inspect the relevant existing implementation rather than inferring behavior from filenames alone. For a feature that crosses layers, inspect all of these as applicable:

- the localized page and nearest layout;
- the related component and hook;
- the Jotai store or React Query cache behavior;
- the API route and service module;
- the Mongoose model and shared TypeScript type;
- English and Vietnamese message keys;
- related docs or operational scripts.

## Important project conventions

### Development

Run the local server with:

```bash
npm run dev
```

The configured port is `4000`, so the application is normally available at `http://localhost:4000`. Use `npm run build` for production validation and `npx tsc --noEmit` for a focused type check. There is no configured test or lint script at present.

The repository has both npm and pnpm lockfiles. Keep lockfiles stable and use the package manager selected by the existing task/environment. Do not perform dependency upgrades unless requested.

### Routes and permissions

Localized UI is under `src/app/[locale]`. API routes are grouped as:

- `src/app/api/(public)`: unauthenticated customer-facing APIs;
- `src/app/api/(private)`: authenticated customer APIs;
- `src/app/api/admin`: administrator APIs;
- `src/app/api/auth`: login, registration, logout, current-user, and password operations;
- `src/app/api/(services)`: shared server-side service logic.

Never weaken an existing guard to make a page or API call work. When adding an endpoint or admin action, determine the expected actor, ownership rules, validation, status transitions, and cache invalidation from neighboring code.

### Forms and business data

Product, category, document, account, inquiry, order, cart, feedback, and configuration flows have both UI and API concerns. Preserve their existing loading, error, empty, confirmation, pagination, and permission states.

Orders and cart operations are business-critical. Be especially careful with totals, status transitions, cancellation, feedback eligibility, guest-to-user cart merge/sync, and duplicate mutation requests. Do not change these semantics without explicitly tracing all consumers.

For product/admin forms, preserve rich-text, image/file upload, category, slug, status, and tiered-price behavior. Cloudinary and file/image upload routes must remain server-authorized and must not leak credentials.

### Localization

When adding visible copy, update both `src/messages/en.json` and `src/messages/vi.json` with matching structure. Use the existing `next-intl` request/routing configuration and locale-aware navigation. Avoid hard-coded strings in reusable localized UI.

### React boundaries

Components are Server Components unless they explicitly need client behavior. Keep `'use client'` limited to interactive components and do not import database/models/secrets into them. Use the existing providers in `src/app/[locale]/(providers)` and preserve their ordering unless there is a demonstrated reason to change it.

### Database and input safety

Use `src/lib/db.ts` for MongoDB access and existing models under `src/models`. Validate external input and preserve sanitization for rich text and uploaded content. Do not log passwords, tokens, cookies, environment values, personal customer data, or full request bodies.

## Editing and verification checklist

Before finishing a task:

1. Confirm only requested behavior changed.
2. Check server/client imports and authentication boundaries.
3. Check English/Vietnamese message parity for visible text.
4. Check TypeScript types and API response compatibility.
5. Run `npx tsc --noEmit`; run `npm run build` for changes that affect routes, config, server code, or production behavior.
6. Inspect `git diff` and ensure `.next`, environment files, generated metadata, and unrelated edits are not included.

In the final handoff, state what changed, what commands passed, and any manual browser/database/environment verification that remains.

## Scope

These instructions apply to the entire repository. A more specific `AGENTS.md` or `CLAUDE.md` in a subdirectory may add narrower rules for that subtree; if one is added later, follow both files and let the more specific instruction govern only its own subtree.
