# Extracted Modules — Integration Guide

These four features were removed from the live store and packaged here so they can be re-added later, here or in another Next.js app.

| Module | What it is | Depends on |
|---|---|---|
| [`sesi-agent/`](#1-sesi-agent-ai-skincare-chatbot) | Sesi, the AI skincare chatbot: floating chat, onboarding overlay, product recommendations, feedback votes | — |
| [`doctor-sasi/`](#2-doctor-sasi-landing-page) | `/doctor-sasi` cinematic landing page (hero spotlight, scroll-driven video, chat) | **sesi-agent** (embeds `SesiChat`) |
| [`kira-agent/`](#3-agent-kira-admin-ai-console) | Agent Kira, the admin AI operations console at `/ueadmin/kira` | **sesi-agent** schema (`SesiVote`) |
| [`live-notifications/`](#4-live-notifications-pusher-websocket) | Pusher WebSocket new-order alerts (sound + toast) in the admin panel | — |

The site keeps working without any of them. Nothing outside this folder imports them, and `extracted/` is excluded from `tsconfig.json` and `eslint.config.mjs`.

## How the folders are laid out

Each module keeps its **original repo paths** under its own root:

```
extracted/sesi-agent/src/components/Sesi/SesiChat.tsx   →   src/components/Sesi/SesiChat.tsx
extracted/sesi-agent/public/sesi-avatar.png             →   public/sesi-avatar.png
```

So the first step of every integration is the same: copy the module's `src/` and `public/` into the project root.

```bash
cp -r extracted/<module>/src/.    src/
cp -r extracted/<module>/public/. public/   # if the module has one
```

All of them assume the store's shared setup: the `@/` alias pointing at `src/`, `@/lib/prisma`, `@/lib/admin-session`, Tailwind, `framer-motion`, `lucide-react` and `react-hot-toast`.

> **Git note:** the `kira-agent` files were never committed before extraction. Commit `extracted/` to keep them.
> Everything else can also be recovered from git history at commit `37904c9`, the last commit before removal.

---

## 1. Sesi agent (AI skincare chatbot)

**Contents**
- `src/components/Sesi/`: chat UI, panel, routine builder, radar chart, product cards, vote widget, `useSesi` Zustand store
- `src/components/SesiOnboarding/`: first-visit overlay with a desktop-only 3D scene
- `src/components/SesiWidget.tsx`: older standalone widget. It was unused at extraction time and is kept for reference.
- `src/lib/sesi/brain.ts`: Groq prompt and model call (`llama-3.3-70b-versatile`)
- `src/lib/sesi/gifs.ts`
- `src/app/api/sesi/{chat,recommend-products,vote}/route.ts`
- `public/sesi-avatar.png`
- `schema.prisma.snippet`: the `SesiVote` model
- `datalayer.snippet.ts`: `trackSesiOnboardingShown` / `trackSesiOnboardingChoice`

**Steps**

1. Copy files (see above).
2. Install dependencies:
   ```bash
   npm install groq-sdk @react-three/fiber @react-three/drei
   ```
   `three`, `zustand`, `recharts` and `framer-motion` are already in the store.
3. Add the `SesiVote` model from `schema.prisma.snippet` to `prisma/schema.prisma`, then run `npx prisma generate`.
4. Append `datalayer.snippet.ts` to the end of `src/lib/datalayer.ts`. It uses that file's `pushToDataLayer`.
5. Env vars:
   ```
   GROQ_API_KEY=...
   NEXT_PUBLIC_SESI_ENABLED=true   # "false" hides Sesi everywhere
   ```
6. Mount it in `src/components/MainStoreLayout.tsx`. Mount it **after hydration only**, because it reads persisted client state:
   ```tsx
   import { useState, useEffect } from "react";
   import Sesi from "./Sesi";
   import SesiOnboarding from "./SesiOnboarding";

   const [showSesi, setShowSesi] = useState(false);
   useEffect(() => { setShowSesi(true); }, []);
   // ...inside the returned layout, after <MobileBottomNav />:
   {showSesi && <Sesi />}
   {showSesi && <SesiOnboarding />}
   ```
7. *(Optional)* Add the mobile dock button in `src/components/MobileBottomNav.tsx`:
   ```tsx
   import { Sparkles } from "lucide-react";
   import { useSesi } from "./Sesi/useSesi";

   const sesiEnabled = useSesi((s) => s.enabled);
   const openSesi = useSesi((s) => s.setOpen);

   // in navItems, between Products and Cart:
   ...(sesiEnabled ? [{ icon: Sparkles, label: "Sesi", isSesi: true }] : []),

   // in the map: render a <button onClick={() => openSesi(true)}> instead of <Link> when item.isSesi
   ```
   The full original component is at `git show 37904c9:src/components/MobileBottomNav.tsx`.
8. *(Optional)* Show feedback on the admin dashboard. `SesiVote` stores `"Happy" | "Okay" | "Sad"`. The dashboard's Customer Sentiment card currently uses Google/manual `Review` ratings instead (4–5 = happy, 3 = okay, 1–2 = sad). Swap the four `prisma.review.count(...)` calls in `src/app/ueadmin/dashboard/page.tsx` back to `prisma.sesiVote.count(...)` if you prefer Sesi votes.

**Gotchas**
- Always import `SesiChat` client-only:
  ```ts
  const SesiChat = dynamic(() => import('@/components/Sesi/SesiChat'), { ssr: false });
  ```
- `SesiChat` has a light UI (`bg-white/80` bubbles plus `backdrop-blur`). Render it on a **white** container, otherwise the blur composites against the dark background and the bubbles look black.
- Products recommended by `/api/sesi/recommend-products` must still pass `hasValidPrice(product, country)` before display.

---

## 2. Doctor Sasi landing page

**Requires `sesi-agent` first**, because the page embeds `SesiChat`.

**Contents**
- `src/app/doctor-sasi/{page,layout,DoctorSasiLanding,LoadingScreen}.tsx`
- `public/video/frames/frame_0001.jpg … frame_0240.jpg` (240 scroll frames)
- `public/video/doctor-sasi-cinematic.mp4` (about 6.5 MB in total)

**Steps**

1. Integrate `sesi-agent`.
2. Copy `src/` and `public/`.
3. Make the route full-screen by bypassing the global layout in two places:
   - `src/components/MainStoreLayout.tsx`:
     ```tsx
     const isDoctorSasi = pathname?.startsWith("/doctor-sasi");
     if (isAdmin || isDoctorSasi) return <>{children}</>;
     ```
   - `src/components/ClientLayout.tsx`: skip `NavigationScroll` and `FloatingCartButton` when `isDoctorSasi`:
     ```tsx
     const isDoctorSasi = pathname?.startsWith("/doctor-sasi");
     {!isDoctorSasi && (<Suspense fallback={null}><NavigationScroll /></Suspense>)}
     {isClient && !isDoctorSasi && !isUeAdmin && <FloatingCartButton />}
     ```

**How the page works**
1. **Hero**: fullscreen background with a cursor-tracking canvas spotlight. BG_2 is revealed with the `destination-in` composite op.
2. **VideoSection**: a 400vh scroll driver with a `position: sticky` inner pane. The frame index comes from `window.scrollY - section.offsetTop`, and the canvas reads its size with `getBoundingClientRect()` inside the rAF loop.
3. **ChatSection**: `SesiChat` inside a `background: #ffffff` container.

**Gotcha:** all three sections must be in the DOM from the first client render. The hero sits on top as `position: fixed; z-index: 9999` until clicked. Never conditionally mount `VideoSection`, because its scroll listeners must be live before the user scrolls to it.

---

## 3. Agent Kira (admin AI console)

**Contents**
- `src/app/ueadmin/kira/`: `KiraClient`, agent terminal, stasis pods, report modals, lock modal, Siri orb
- `src/app/api/admin/kira/chat/route.ts`: Groq chat (`qwen/qwen3.8-27b`), with a deterministic fallback when no key is set
- `src/app/api/admin/kira/telemetry/route.ts`: aggregates orders, products, inventory, checkouts, discounts and tracking logs for the console
- `src/app/api/admin/kira/verify-token/route.ts`: access-token gate for the console
- `src/lib/kira/sound.ts`: Web Audio chimes

**Steps**

1. Add the `SesiVote` model (step 3 of sesi-agent). Telemetry reads it. Alternatively, remove the `prisma.sesiVote.count` block from `telemetry/route.ts`.
2. `npm install groq-sdk` and set `GROQ_API_KEY`. Without a key, chat falls back to deterministic answers.
3. Copy `src/`.
4. Add the sidebar entry to the `links` array in `src/app/ueadmin/_components/AdminSidebar.tsx`:
   ```ts
   { label: "Agent Kira (24/7 AI)", href: "/ueadmin/kira", icon: Sparkles, show: true },
   ```
5. *(Optional)* The dashboard "Agent Kira command strip" banner linking to `/ueadmin/kira` was removed from `src/app/ueadmin/dashboard/DashboardClient.tsx`. Re-add any link or banner you want.

**⚠️ Fix before re-enabling**
- `chat/route.ts` and `telemetry/route.ts` do **not** check the admin session. Telemetry exposes store-wide sales data. Add the same guard the other admin routes use:
  ```ts
  import { getAdminApiSession } from "@/lib/admin-session";
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  ```
- `verify-token/route.ts` falls back to a hard-coded token, `DEFAULT_FALLBACK_TOKEN`, when no `AppSettings` row with `type: 'kira_lock_security'` exists. Create that row with your own token, or remove the fallback.

---

## 4. Live notifications (Pusher WebSocket)

Real-time admin alerts: a beep plus a "New order" toast when an order is paid, with a 5-minute polling fallback.

**Contents**
- `src/lib/pusher.ts`: server client plus `triggerNotification()` and `notifyNewOrder()`. Hard-coded credential fallbacks were **stripped**, so it reads env vars only.
- `src/app/ueadmin/_components/OrderAlertListener.tsx`: admin-side listener (Pusher subscription, polling fallback, Web Audio beep, toast)
- `src/hooks/useAdminNotifications.ts`: a generic hook. It was unused at extraction time.
- `src/app/api/admin/orders/latest/route.ts`: the latest order, used by the polling fallback
- `src/app/api/events/{cart-added,checkout-entered}/route.ts`: storefront activity pings

**Steps**

1. `npm install pusher pusher-js`
2. Env vars (from pusher.com → App Keys):
   ```
   PUSHER_APP_ID=
   PUSHER_KEY=
   PUSHER_SECRET=
   PUSHER_CLUSTER=
   NEXT_PUBLIC_PUSHER_KEY=
   NEXT_PUBLIC_PUSHER_CLUSTER=
   ```
3. Copy `src/`.
4. Mount the listener in `src/app/ueadmin/_components/UeAdminLayoutContent.tsx`, as the first child of **both** `<AdminGuard>` blocks (auth pages and the main layout):
   ```tsx
   import { OrderAlertListener } from './OrderAlertListener';
   <AdminGuard>
     <OrderAlertListener />
     ...
   ```
5. Fire `notifyNewOrder` wherever an order becomes confirmed. These are the call sites it was removed from:

   | File | Where |
   |---|---|
   | `src/app/api/create-order/route.ts` | after stock decrement, before the success response (not awaited) |
   | `src/app/api/payments/cod/route.ts` | after the customer email, before `revalidatePath('/ueadmin/orders')` |
   | `src/app/api/payments/stripe/webhook/route.ts` | after the customer email, before the admin email |
   | `src/app/api/payments/tabby/capture/route.ts` | after building `customerName`, before the admin email |
   | `src/app/api/webhooks/payments/route.ts` | after building `customerName`, before the admin email |
   | `src/services/payments/tabby/process.ts` | after building `customerName`, before the admin email |
   | `src/services/payments/tamara/process.ts` | after building `customerName`, before the admin email |

   The call shape is:
   ```ts
   import { notifyNewOrder } from "@/lib/pusher";

   await notifyNewOrder({
     id: order.id,
     total: order.total ?? 0,
     currency: order.currency,
     userName: customerName,
     email: order.email || undefined,
   }).catch((err) => console.error("Pusher notification failed:", err));
   ```
   Always `.catch()` it, so a Pusher outage never breaks payment confirmation.
6. *(Optional)* Activity pings:
   - `src/lib/cart-store.ts` → in `addItem`, after the `validPrice` check:
     ```ts
     fetch("/api/events/cart-added", { method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ productId: product.id, name: product.name, quantity, price: validPrice, country: selectedCountry }) }).catch(() => {});
     ```
   - `src/app/cart/page.tsx` (the `begin_checkout` effect) and `src/app/checkout/payment/[id]/page.tsx` (after `setOrder`):
     ```ts
     fetch("/api/events/checkout-entered", { method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ itemCount, total, currency, country }) }).catch(() => {});
     ```
7. *(Optional)* Add `<link rel="dns-prefetch" href="https://stats.pusher.com" />` to `<head>` in `src/app/layout.tsx`.
8. *(Optional)* Add `Pusher: any;` to the `Window` interface in `src/globals.d.ts`.

**⚠️ Security:** the old Pusher credentials, including `PUSHER_SECRET`, were committed to this repo in `src/lib/pusher.ts` and `vercel.env.example`. **Rotate the app secret in the Pusher dashboard** before re-enabling, or create a new Pusher app.

---

## Verify after integrating

```bash
npx prisma generate
npm run type-check
npm run lint
npm run dev
```

| Module | Check |
|---|---|
| Sesi | The chat bubble appears on the storefront and replies |
| Doctor Sasi | `/doctor-sasi` loads with no navbar, and the scroll video scrubs |
| Kira | `/ueadmin/kira` is in the sidebar and loads telemetry while logged in, and returns **403** while logged out |
| Live notifications | Placing a COD test order beeps and shows a toast in an open admin tab |
