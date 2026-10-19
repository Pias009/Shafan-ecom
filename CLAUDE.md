# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run type-check   # TypeScript validation (no emit)
npm run lint         # ESLint
npm run db:push      # Push Prisma schema to MongoDB
npm run db:seed      # Seed database
npm run mail-test    # Test email rendering
```

There is no automated test suite. Validation is done via `type-check` and `lint`.

## Architecture

### Multi-Region Store System
The platform serves 6 GCC countries (AE, SA, KW, BH, OM, QA). Country/currency resolution happens in `middleware.ts` — it checks query params, pathname suffixes (`_AE`, `_SA`…), then Vercel geo headers, defaulting to Kuwait. The resolved `store_code` cookie is read by `useCountryStore` (Zustand) throughout the client.

Every product has a `countryPrices[]` array. The `hasValidPrice(product, country)` utility in `src/lib/product-utils.ts` must gate any product displayed to users — products without a price for the current country must never appear.

### State Management
Three core Zustand stores in `src/lib/`:
- `cart-store.ts` — cart items, coupon, address flag, country-aware price refresh
- `country-store.ts` — selected country + currency, hydration state
- `currency-store.ts` — active currency symbol

All stores use persistence. Wait for `_hasHydrated` from `useCountryStore` before rendering prices to prevent flash.

### Payment Flow
Three payment providers coexist:
- **Stripe** — card payments, managed via `src/lib/stripe.ts`
- **Tabby** — BNPL, GCC-specific
- **Tamara** — BNPL, GCC-specific

Order creation is in `/api/create-order`. Payment is finalised at `/checkout/payment/[orderId]`. Webhook endpoints are in `/api/payment/`.

### Admin Panel
Lives at `/ueadmin`. Completely bypasses `MainStoreLayout` and `ClientLayout` (checked via `pathname.startsWith('/ueadmin')` in both). Controlled by `ACTIVE_ADMIN_PANELS` env var — middleware returns 403 for `/ueadmin` unless it is `"true"`.

- **Auth:** the `admin-session` cookie is an HMAC-signed token (`src/lib/admin-token.ts`, keyed by `ADMIN_SESSION_SECRET` or `NEXTAUTH_SECRET`). Middleware verifies the signature for `/ueadmin` pages; `src/lib/admin-session.ts` resolves the user (20s in-memory cache). Every `/api/admin/*` route must guard itself with `requireAdminApi()` / `getAdminApiSession()` — middleware does not cover API routes.
- **Shell:** `ueadmin/layout.tsx` resolves the session once on the server and passes it to the client shell (`_components/UeAdminLayoutContent.tsx`). Read it with `useAdminSession()` (context, no fetch). Navigation lives in `_components/admin-nav.ts` (sidebar, breadcrumbs and ⌘K palette all read it).
- **Styling:** `ueadmin/admin.css` normalises legacy loud utilities inside `.admin-scope`; add `adm-raw` to a wrapper to opt a bespoke screen out. New pages should use the primitives in `_components/ui.tsx`.

### Layout Bypass Pattern
Routes that need full-screen custom layouts bypass the global nav/footer by adding their path prefix to two files:
- `src/components/MainStoreLayout.tsx` — add `pathname.startsWith('/your-route')`
- `src/components/ClientLayout.tsx` — add same check to suppress `FloatingCartButton`

### Extracted Modules
The Sesi AI chatbot, the `/doctor-sasi` landing page, and the Pusher live order notifications were removed from the site and packaged under `extracted/` (excluded from `tsconfig.json` and ESLint). See `extracted/README.md` before re-adding any of them. Agent Kira (`/ueadmin/kira`) was re-integrated; its unlock token comes from `KIRA_ACCESS_TOKEN` or the `kira_lock_security` AppSettings row. Kira HQ is full-screen (bypasses the admin shell in `UeAdminLayoutContent`). Her 11 teams and 3 departments are defined in `src/lib/kira/teams.ts`; every team's live metrics/findings come from `src/lib/kira/insights.ts` (one cached batch, used by both `/api/admin/kira/telemetry` and the chat prompt). Add a team by extending both files. The Engineering team reads real-user Core Web Vitals and JS errors that `src/components/SiteHealthReporter.tsx` (storefront only, mounted in `ClientLayout`) posts to `/api/performance/metrics`. On unlock Kira greets the admin by voice, listens for the reply, then briefs (`stage: 'greeting-reply'` in the chat API); the `autoGreet` voice setting turns this off. Kira's voice assistant (`src/lib/kira/voice.ts`, `ueadmin/kira/useKiraVoice.ts`) records in the browser and transcribes via `/api/admin/kira/transcribe` (Groq Whisper); spoken replies use `/api/admin/kira/speak` (Groq Orpheus), then a built-in in-browser Piper voice (`@mintplex-labs/piper-tts-web`, model cached in OPFS, preloaded on the lock screen), then the browser voice. Its `onnxWasm` CDN path in `voice.ts` must match the pinned `onnxruntime-web` version, and `next.config.ts` aliases `fs` to `src/lib/empty-module.ts` for its Emscripten code. Spoken questions always get spoken answers, even when muted (`force`). Teams can be switched on/off (shared, `kira_team_state` AppSettings row via `/api/admin/kira/teams`, `src/lib/kira/team-state.ts`); paused teams are skipped by chat routing, the prompt and briefings, and `parseTeamToggle` handles "Kira, turn off the pricing team". The microphone is allowed only on `/ueadmin/*` via `Permissions-Policy` in both `next.config.ts` and `vercel.json` — keep them in sync.

### Tracking & Analytics
All analytics events go through the GTM data layer via `src/lib/datalayer.ts`. `trackAddToCart`, `trackPurchase`, etc. are typed helpers. GTM is loaded in `src/components/GTMProvider.tsx`. Meta Pixel and GA run in parallel via their own providers. Do not call `window.dataLayer.push` directly — always use the typed helpers.

### Product Data Flow
`getHomePageData()` in `src/lib/products.ts` fetches all home sections in parallel. The `isDummyProduct()` check in `HomeClient.tsx` filters out seed data products by name/brand. Products must pass `hasValidPrice(p, selectedCountry)` before being rendered anywhere on the client.

### Image Handling
Product images go through Cloudinary (`src/lib/cloudinary*.ts`). The global `next.config.ts` allows all remote image hosts. The `img` tag in `globals.css` has `pointer-events: none` and `user-drag: none` for content protection — this is intentional and must not be changed.

### Key Environment Variables
See `vercel.env.example` for the full list. Critical ones:
- `DATABASE_URL` — MongoDB connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `CLOUDINARY_*` — image uploads
