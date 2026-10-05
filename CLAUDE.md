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
Lives at `/ueadmin`. Completely bypasses `MainStoreLayout` and `ClientLayout` (checked via `pathname.startsWith('/ueadmin')` in both). Protected in `middleware.ts` via session check. Controlled by `ACTIVE_ADMIN_PANELS` env var — if unset, all panels are accessible.

### Layout Bypass Pattern
Routes that need full-screen custom layouts bypass the global nav/footer by adding their path prefix to two files:
- `src/components/MainStoreLayout.tsx` — add `pathname.startsWith('/your-route')`
- `src/components/ClientLayout.tsx` — add same check to suppress `FloatingCartButton`

### Extracted Modules
The Sesi AI chatbot, the `/doctor-sasi` landing page, the Agent Kira admin console, and the Pusher live order notifications were removed from the site and packaged under `extracted/` (excluded from `tsconfig.json` and ESLint). See `extracted/README.md` before re-adding any of them.

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
