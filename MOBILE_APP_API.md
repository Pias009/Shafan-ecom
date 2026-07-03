# SHANFA Global — Mobile App (Flutter) API Reference

> **Purpose:** Complete reference of every **customer-facing** API on the existing Next.js site
> (`shanafaglobal.com`) so a Flutter app for iOS/Android can be built against the **same server**.
> The admin panel (`/ueadmin`, `/api/admin/*`) stays web-only and is NOT documented here.
>
> Hand this file to Claude (or any developer) when building the Flutter app. Every endpoint below
> exists today in `src/app/api/` — no server changes are required unless listed in the
> **"Gaps / Recommended new endpoints"** section at the bottom.

---

## 1. General conventions

| Thing | Value |
|---|---|
| Base URL (production) | `https://shanafaglobal.com` |
| Format | JSON request/response unless noted |
| Auth | NextAuth **cookie session** (JWT strategy) — see §3 |
| Countries served | `AE`, `SA`, `KW`, `BH`, `OM`, `QA` (2-letter ISO) |
| Currencies | `AED`, `SAR`, `KWD`, `BHD`, `OMR`, `QAR` |
| 3-decimal currencies | `KWD`, `BHD`, `OMR` (all others 2 decimals) |
| Product IDs | MongoDB ObjectId — 24 hex chars |

### The country/price rule (CRITICAL)

Every product has a `countryPrices[]` array. **A product must only be shown if it has an
`active` price entry for the user's selected country** (`countryPrices.find(cp => cp.country == selected && cp.active && cp.price > 0)`).
The web app enforces this with `hasValidPrice()` — the Flutter app must replicate this filter
client-side, because `/api/products` returns products for all countries.

### `store_code` cookie

The web middleware resolves country into a `store_code` cookie with these values:

| store_code | Country | Currency |
|---|---|---|
| `UAE` | AE | AED |
| `SAUDI` | SA | SAR |
| `KUWAIT` (default) | KW | KWD |
| `BAHRAIN` | BH | BHD |
| `OMAN` | OM | OMR |
| `QATAR` | QA | QAR |

Most endpoints take country as an **explicit query param** — prefer that. The only endpoint that
reads the cookie is `/api/products/search` (defaults to `UAE`/AE if absent). In Flutter, either
send a `Cookie: store_code=UAE` header on search calls, or ignore the returned `price` field and
compute price locally from the returned `countryPrices[]`.

---

## 2. Country / geo bootstrap

**Integrate in: app startup / country selector screen.**

### `GET /api/geo`
Detect user country from IP (Vercel header). No auth.
- Query: `?test_country=AE` (optional, for testing)
- Response: `{ "country": "AE" }` — defaults to `KW` when header missing (e.g. localhost).

### Geo-based auto country switch (replicate the web middleware)

The website auto-selects the store via `middleware.ts`; the app must replicate this logic
locally on **first launch**:

1. Call `GET /api/geo` → get 2-letter country from the user's IP.
2. If it is one of the 6 GCC codes (`AE SA KW BH OM QA`) → select it; **otherwise default to `KW` (Kuwait)** — exactly what the web does.
3. Persist the choice locally (the web stores it as a 30-day `store_code` cookie) and **do not auto-detect again** while a saved choice exists — user's manual selection always wins.
4. Offer a manual country picker (populated from `GET /api/checkout/allowed-countries`) that overwrites the saved choice.
5. On every country change: re-price the cart via `GET /api/products/prices?ids=…&country=XX`, drop items priced `0`, and refetch banners/products for the new country.

### `GET /api/checkout/allowed-countries`
Returns countries that accept orders, with delivery config. Use this to build the country picker
and to show min-order / delivery-fee / free-delivery-threshold in cart & checkout.
```json
{
  "activeCountries": [
    { "code": "AE", "name": "United Arab Emirates", "currency": "AED",
      "minOrder": 0, "deliveryFee": 0, "freeDelivery": 0,
      "estimatedDays": "2-3", "regions": [] }
  ],
  "totalCountries": 6
}
```

### `POST /api/checkout/allowed-countries`
Validate one country before checkout.
- Body: `{ "countryCode": "AE" }`
- Response: `{ "allowed": true }` or `{ "allowed": false, "message": "...", "countryName": "..." }` (HTTP 400 when not allowed).

---

## 3. Authentication (NextAuth)

The server uses **NextAuth with JWT sessions stored in an httpOnly cookie**. There is no Bearer
token API. The Flutter app must use an HTTP client with a **persistent cookie jar**
(e.g. `dio` + `dio_cookie_manager` + `cookie_jar` with `PersistCookieJar` backed by secure storage).

Session cookie name: `__Secure-next-auth.session` (production) / `next-auth.user-session` (dev).
All authenticated endpoints (§8 Account, order history, etc.) work automatically once the cookie
jar holds this cookie.

### 3.1 Register — `POST /api/auth/register`
- Body: `{ "name": "optional (1-60 chars)", "email": "a@b.com", "password": "min 6 chars", "country": "AE (optional)" }`
- Success: `{ "ok": true }` · Errors: `400` invalid payload, `409` `{ "error": "Email already registered." }`
- Registering does **not** log the user in — call login next.

### 3.2 Login (email + password) — NextAuth credentials flow
Provider id is **`user-login`**. Two-step flow:

1. `GET /api/auth/csrf` → `{ "csrfToken": "..." }` (also sets a csrf cookie — keep it in the jar)
2. `POST /api/auth/callback/user-login`
   - Content-Type: `application/x-www-form-urlencoded`
   - Body fields: `csrfToken=<token>&email=<email>&password=<password>&json=true`
   - On success the response **sets the session cookie**. Wrong credentials do not set the cookie
     (response contains an error/redirect URL with `error=CredentialsSignin`).
3. Verify: `GET /api/auth/session` → `{ "user": { "id", "name", "email", "role" }, "expires": "..." }`
   (empty object `{}` when not logged in).

Notes:
- Admin/superadmin accounts are **blocked** from this provider (returns null) — user accounts only.
- There is also an MFA provider (`POST /api/auth/mfa/initiate` with `{email, password}` →
  may return `{ mfaRequired: true }` and email a token; then sign in via provider id `mfa` with
  `token=<token>` using the same callback pattern: `POST /api/auth/callback/mfa`). Only relevant
  if MFA is enabled on the account; normal customers use `user-login`.

### 3.3 Google sign-in
Configured via NextAuth Google provider (browser redirect flow). For the app, the simplest v1
approach: open `https://shanafaglobal.com/api/auth/signin/google` in an in-app browser /
`flutter_web_auth_2` session and capture the session cookie, or skip Google login in v1.
(A native Google-token endpoint does not exist yet — see Gaps.)

### 3.4 Logout — `POST /api/auth/signout`
Form-encoded with `csrfToken` (from `/api/auth/csrf`). Then clear the local cookie jar.

### 3.5 Password reset
- `POST /api/auth/password/request-reset` — `{ "email": "a@b.com" }` → always `{ "ok": true }`
  (anti-enumeration). Sends an email with a link to the **website** reset page containing `?token=`.
- `POST /api/auth/password/reset` — `{ "token": "...", "password": "new (min 6)" }` → `{ "ok": true }`
  · `400` `{ "error": "Invalid token." | "Token has expired." }`
- If the app wants an in-app reset screen, it can deep-link the email URL and call the second
  endpoint directly with the token.

---

## 4. Catalog

**Integrate in: home screen, product listing, search screen, product detail, cart re-pricing.**

### `GET /api/products`
Paginated product list. No auth. Cached ~1h on the CDN.
- Query: `store` (optional store code), `page` (default 1), `limit` (default 20),
  `select=name,id` or `select=name,id,sku` (lightweight mode for pickers).
- Response: array/list of products with: `id, name, slug, shortDescription, mainImage, images[],
  stockQuantity, averageRating, ratingCount, totalSales, price, discountPrice, currency, active,
  hot, trending, brand{name}, productCategories[{category{id,name}}], countryPrices[]`.
- ⚠️ No `category`/`brand` query filters are exposed on this route (the underlying lib supports
  them but the route doesn't read them) — filter client-side or see Gaps.
- ⚠️ Apply the **country price rule** (§1) before displaying anything.

### `GET /api/products/search`
Live search (name, brand, sub-category). No auth.
- Query: `q` (min 2 chars), `limit` (default 10).
- Reads `store_code` cookie for localized `price`/`currency` (defaults UAE/AED) — send the cookie
  header or use the included `countryPrices[]`.
- Response: `{ "products": [ { id, name, slug, price, currency, discountPrice, mainImage,
  imageUrl, brand, brandName, category, subCategory, countryPrices[] } ] }`

### `GET /api/products/prices`
Batch re-price (used when user switches country / to refresh cart prices).
- Query: `ids=<id1>,<id2>,...` (24-hex ids), `country=AE` (default `KW`).
- Response: `{ "prices": { "<productId>": 123.5, "<productId2>": 0 } }` — `0` = no valid price
  in that country → **remove from cart / hide**.

### `GET /api/brands`
All brands, alphabetical, each with `_count.products` (active products). No auth.

---

## 5. Content (banners, blog, reviews)

**Integrate in: home screen carousels, offers section, blog tab, testimonial section.**

### `GET /api/banners/active`  ← preferred for the app
- Query: `country=AE` (default AE), `displayOn=HOME|PRODUCTS|BOTH` (default BOTH).
  ⚠️ `displayOn` is **page placement**, not device: pass `displayOn=HOME` on the home screen and
  `displayOn=PRODUCTS` on product-listing screens (banners marked `BOTH` are always included).
- Country-filtered and date-windowed (only banners whose `startDate`/`endDate` window covers now).
  Returns full banner objects sorted by `sortOrder`/`priority`.

### `GET /api/banners`
Simpler cached list (no country filter): `id, imageUrl, title, description, ctaLink, ctaText,
position, backgroundColor, textColor`.

### `GET /api/offer-banners`
Enhanced offer banners. Query: `isHero=true` (priority-2 hero banners only), `active=true`.
Invalid image URLs are replaced with `/placeholder-product.png` (relative — prefix base URL).

### `GET /api/promotional/banners`
- Query: `limit` (default 10), `priority` (1–3 optional).
- Response fields: `id, imageUrl, title, subtitle, offerText, ctaText, backgroundColor,
  textColor, backgroundImage, link, discountId, priority, clicks`.

### `GET /api/blog` / `GET /api/blog/{slug}`
- List: published posts — `id, title, slug, excerpt, coverImage, tags, createdAt`.
- Detail by slug: full post object; `404` if missing/unpublished.

### `GET /api/google-reviews`
Store testimonials (synced from Google, served from DB):
`{ success, reviews: [{ id, author_name, rating, text, relative_time_description }],
rating: { average, total }, mapsLink }`

---

## 6. Cart & coupons

**The cart itself is client-side** — the web uses a persisted Zustand store; in Flutter keep the
cart in local storage (e.g. Hive/shared_preferences) with items `{ productId, slug, name, image,
quantity, price, currency }`. On app start and on **country change**, re-validate every item via
`GET /api/products/prices` (§4) and drop items priced `0`.

### `GET /api/coupons/validate`
**Integrate in: cart screen coupon field.**
- Query: `code=SAVE10`, `country=AE` (default AE).
- Success:
```json
{ "valid": true, "discount": 0.10, "code": "SAVE10", "description": "...",
  "type": "PERCENTAGE", "minimumOrderValue": 100, "maxLimitAmount": 50 }
```
  - `type`: `PERCENTAGE` (then `discount` is a fraction, e.g. `0.10` = 10%),
    `FIXED_AMOUNT` (then `discount` is the amount), or `FREE_SHIPPING`.
- Failure: HTTP 400 `{ "valid": false, "error": "Invalid or expired coupon" }`.
- This endpoint is for **display only** — the final discount is re-computed server-side at order
  creation (usage limits per user are enforced there).

---

## 7. Checkout & payments

**Integrate in: checkout screen → payment method screen → success/failure screen.**

> ⚠️ **`create-order` alone is NOT a complete order.** It saves the order as
> `paymentStatus: PENDING`, which the admin panel's new-order alerts, notifications, and
> emails deliberately ignore (it looks like an abandoned checkout). The app **must** follow up
> with step 2 below — `POST /api/payments/cod` for COD, or a completed Stripe/Tabby/Tamara
> payment — before the order is confirmed, the shipment is created, and the admin is notified.
> (Pending orders are still visible to the admin under `/ueadmin/orders` → status "ALL".)

### The flow (identical for all payment methods)

```
1. POST /api/create-order          → returns orderId (order saved, paymentStatus = PENDING)
2. Depending on method:
   COD    → POST /api/payments/cod                      → done
   Card   → POST /api/payments/stripe/create-intent     → confirm with flutter_stripe SDK
   Tabby  → POST /api/payments/tabby/create-session     → open checkoutUrl in browser/webview
   Tamara → POST /api/payments/tamara/create-session    → open checkout URL in browser/webview
3. Payment confirmation happens via SERVER webhooks (already implemented — no app work).
4. App verifies result by polling GET /api/orders/{orderId} and checking paymentStatus/status.
```

### 7.1 `POST /api/create-order`
No auth required (**guest checkout supported**); if logged in, the order is attached to the user
and a saved address can substitute for a missing body address.

Request body:
```json
{
  "items": [ { "productId": "24-hex-id", "slug": "optional-fallback", "quantity": 1 } ],
  "country": "AE",
  "storeCode": "UAE",
  "couponCode": "SAVE10",
  "payment_method": "cod | stripe | tabby | tamara",
  "payment_method_title": "Cash on Delivery",
  "billing": {
    "fullName": "...", "first_name": "...", "last_name": "...",
    "phone": "+9715...", "email": "a@b.com", "country": "AE",
    "city_name": "Dubai", "street_road": "Street 1",
    "house_building": "Apt 2", "area_name": "Marina", "postalCode": ""
  },
  "shipping": { "...same shape as billing..." }
}
```
Notes:
- Prices sent by the client are **ignored** — the server always uses DB prices for the resolved
  country (strict price checking). Stock is validated and decremented.
- Legacy field names also accepted: `address_1`/`address_2`/`city`.
- Server computes: subtotal, delivery fee (per-country config incl. free-delivery threshold),
  coupon discount, VAT (`taxRate` per country), currency-correct rounding.

Success response:
```json
{ "success": true, "orderId": "…", "subtotal": 100, "shipping": 10, "total": 115.5,
  "currency": "aed", "status": "ORDER_RECEIVED", "freeDelivery": false,
  "courier": "GLOBAL_COURIER", "trackingCode": "GL-XXXX-123456", "paymentMethod": "cod" }
```
Error responses (HTTP 400): plain `{ "error": "…" }`, plus special flags the UI should handle:
- `{ "countryNotAllowed": true, "requestedCountry": "XX" }`
- `{ "minOrderRequired": true, "minOrder": 50, "currency": "AED" }`
- Out-of-stock / not-enough-stock errors name the product in `error`.

### 7.2 Cash on Delivery — `POST /api/payments/cod`
**REQUIRED second step for COD — the order is not confirmed without it.**
- Body: `{ "orderId": "…" }`
- Marks order COD, creates the shipment (Aramex for GCC), emails the customer & admin, and fires
  the real-time admin notification.
- Response: `{ "success": true, "orderId", "status", "paymentMethod": "cod", "message" }`

### 7.3 Card (Stripe) — `POST /api/payments/stripe/create-intent`
- Body: `{ "orderId": "…" }`
- Response: `{ "clientSecret": "pi_..._secret_...", "id": "pi_..." }`
- Flutter: use the **`flutter_stripe`** package — init with the publishable key
  (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` value) and confirm the PaymentIntent /
  present PaymentSheet with `clientSecret`. Amount conversion (×100 or ×1000 for
  KWD/BHD/OMR) is already handled server-side.
- Alternative (webview flow): `POST /api/payments/stripe/checkout-session` `{ "orderId" }` →
  `{ "url": "https://checkout.stripe.com/…" }`; success redirects to the **website**
  `/checkout/success?order_id=…` — if used from the app, intercept that URL in the webview.
- Fulfilment (marking PAID, emails, shipment, admin notification) happens in the Stripe
  **webhook** — after the SDK reports success, poll `GET /api/orders/{id}` until
  `paymentStatus == "PAID"`.

### 7.4 Tabby (BNPL) — `POST /api/payments/tabby/create-session`
Available for AE / SA / KW only.
- Body: `{ "orderId": "…", "phone": "optional override", "email": "optional", "lang": "en|ar" }`
- Response: `{ "success": true, "sessionId", "paymentId", "checkoutUrl", "status" }`
- Open `checkoutUrl` in an external browser / custom tab. Rejections return a user-friendly
  `error` message (e.g. amount too high/low) — show it and offer another method.
- Capture is webhook/cron driven; **never** treat the redirect back as payment proof — poll the
  order. (`POST /api/payments/tabby/verify` `{orderId}` exists for manual reconciliation only.)

### 7.5 Tamara (BNPL) — `POST /api/payments/tamara/create-session`
All 6 GCC countries.
- Body: `{ "orderId": "…" }`
- Response includes the Tamara checkout URL — open in browser/webview, then poll the order.

### 7.6 Order status polling — `GET /api/orders/{orderId}`
- No auth needed for guest/pending orders; if a logged-in user requests **someone else's** order → `403`.
- Response: full order incl. `status` (`ORDER_RECEIVED`, `PROCESSING`, … `DELIVERED`,
  `CANCELLED`, `REFUNDED`), `paymentStatus` (`PENDING`/`PAID`/…), `items[]` (with `product`),
  totals, addresses.

---

## 8. Account & order management

All require the **session cookie** (§3) unless noted.

### `GET /api/account/dashboard`
Last 10 orders with items, shipment/tracking info, totals.
- **Guest mode:** `?email=guest@x.com` returns orders placed with that email (no auth).

### `GET /api/account/profile` / `PATCH /api/account/profile`
- GET → `{ name, email, phone, role }`
- PATCH body: `{ "name"?, "email"?, "phone"? }` → `{ ok: true, user: {…} }` · `409` email in use.

### `GET /api/account/address` / `PUT /api/account/address`
One saved address per user (upsert).
- PUT body (required: `fullName`, `phone` (5–20), `email`, `country`): plus optional
  `city_name`, `street_road`, `house_building`, `area_name`, `block_no`, `zone`, `region`,
  `postalCode` (legacy `city`/`address1`/`address2` also accepted).
- Response: `{ ok: true, address: {…} }`.

### `POST /api/account/orders/{id}/action`
Cancel / return an order. Works for guests via `guestEmail` (must match the order email).
- Body: `{ "action": "CANCEL" | "RETURN", "reason": "…", "guestEmail": "optional" }`
- CANCEL: within **30 minutes** → auto-approved (Tabby payments auto-refund/void); later →
  request is recorded for admin approval. Not allowed on DELIVERED/CANCELLED/REFUNDED orders.
- RETURN: creates a return request (admin-reviewed).

### `POST /api/orders/{id}/items/{itemId}/cancel`
Cancel a single line item. Auth via session **or** `?email=guest@x.com`.
- Response: `{ item, allCancelled }` — order flips to CANCELLED when the last item is cancelled.

### `PATCH /api/orders/{id}`
Body `{ "status": "CANCELLED" }` — legacy whole-order cancel (no ownership check; prefer the
`action` endpoint above).

### `GET /api/account/orders/{id}/invoice`
Invoice data as JSON (requires session; order email must match the logged-in user).

---

## 9. Sesi AI skincare advisor

**Integrate in: an in-app chat screen (equivalent of the website's Sesi chatbot).** No auth.

### `POST /api/sesi/chat`
- Body: `{ "message": "user text", "mode": "baby" | "doctor" | "reveal",
  "history": [ { "role": "user"|"assistant", "content": "…" } ] }`
- Response: `{ "text": "…", "mode": "…", "chartData": …, "recommendedProductId": "…| null" }`
- Maintain `history` client-side and send it every turn.

### `POST /api/sesi/recommend-products`
- Body: `{ "skinType": "oily|dry|combination|sensitive|normal|acne-prone|all type",
  "concerns": ["acne","pigmentation","wrinkles", …], "limit": 5 }`
- Response: matching products for recommendation cards.

### `POST /api/sesi/vote` / `GET /api/sesi/vote`
- POST `{ "rating": "Happy" | "Okay" | "Sad" }` → `{ success, happyCount, totalCount }`
- GET → `{ happyCount, okayCount, sadCount, totalCount }`

---

## 10. Shipping & misc

### `POST /api/shipping` (action `rates` only — others are admin)
Live rate quote at checkout (Aramex/Shippo):
- Body: `{ "action": "rates", "toAddress": { "country": "AE", "city": "Dubai" },
  "parcel": { "weight": 1.5 } }`
- Response: `{ rates: [{ id, provider, service, amount, currency, duration, estimatedDays }] }`
- Optional — checkout already computes a flat per-country fee in `create-order`; use this only if
  you want to display live courier options.

### `GET /api/health`
Simple health check — use for connectivity/"server down" detection.

### `POST /api/contact`
- Body: `{ "name", "email", "message" }` → `{ success: true, message: "…" }`
- ⚠️ Currently only logs server-side (no email/DB persistence) — see Gaps.

### `GET /api/proxy-image?url=…`
Image proxy used by the web for CORS-restricted images. Flutter usually won't need it
(no browser CORS), but it exists if a remote image host blocks direct fetches.

---

## 11. Flutter screen → endpoint map (integration guide)

| App screen | Endpoints |
|---|---|
| Splash / bootstrap | `GET /api/health`, `GET /api/geo`, `GET /api/checkout/allowed-countries`, `GET /api/auth/session` |
| Country selector | `GET /api/checkout/allowed-countries` |
| Home | `GET /api/banners/active?country=XX&displayOn=HOME`, `GET /api/offer-banners?active=true` (+ `isHero=true` for hero slider), `GET /api/promotional/banners`, `GET /api/products?page=1&limit=20`, `GET /api/google-reviews` |
| Product listing / infinite scroll | `GET /api/products?page=N&limit=20` (+ client-side country-price filter & category filter) |
| Search | `GET /api/products/search?q=…` |
| Product detail | data from list/search payload (see Gaps — no by-slug endpoint yet) |
| Cart | local storage + `GET /api/products/prices?ids=…&country=XX` + `GET /api/coupons/validate` |
| Login / Register | `POST /api/auth/register`, `GET /api/auth/csrf` + `POST /api/auth/callback/user-login`, `GET /api/auth/session` |
| Forgot password | `POST /api/auth/password/request-reset`, `POST /api/auth/password/reset` |
| Checkout (address) | `GET/PUT /api/account/address`, `POST /api/checkout/allowed-countries` |
| Checkout (place order) | `POST /api/create-order` **then the payment call — never stop after create-order (§7)** |
| Payment | `POST /api/payments/cod` · `POST /api/payments/stripe/create-intent` (+ flutter_stripe) · `POST /api/payments/tabby/create-session` · `POST /api/payments/tamara/create-session` |
| Payment result | poll `GET /api/orders/{id}` |
| My orders | `GET /api/account/dashboard` (`?email=` for guests) |
| Order detail / tracking | `GET /api/orders/{id}` |
| Cancel / return | `POST /api/account/orders/{id}/action`, `POST /api/orders/{id}/items/{itemId}/cancel` |
| Invoice | `GET /api/account/orders/{id}/invoice` |
| Profile | `GET/PATCH /api/account/profile` |
| Sesi AI chat | `POST /api/sesi/chat`, `POST /api/sesi/recommend-products`, `POST /api/sesi/vote` |
| Blog | `GET /api/blog`, `GET /api/blog/{slug}` |
| Contact us | `POST /api/contact` |

**Recommended Flutter HTTP setup:** `dio` with `CookieManager(PersistCookieJar(...))` so the
NextAuth session cookie persists across app restarts; store the jar in app-support dir; add an
interceptor that injects `Cookie: store_code=<CODE>` for `/api/products/search`.

---

## 12. Gaps / recommended new endpoints (small server additions)

These are things the website does **server-side (SSR)** with no public JSON API, so the app
either works around them or the backend adds tiny endpoints:

1. **Product detail by slug/id** — no `GET /api/products/{slug}` exists (product pages are SSR).
   Workaround: reuse the object from list/search. Recommended: add a public
   `GET /api/products/{slug}` returning the full product (description, images, categories,
   countryPrices, related products).
2. **Categories list** — only `/api/admin/categories` exists (admin-protected). The app needs a
   public `GET /api/categories` for the category browser. Home-page sections
   (`getHomePageData()`) are also SSR-only — a `GET /api/home` endpoint returning the same
   sections would make the app home screen 1 request instead of 5.
3. **Category/brand filtering on `/api/products`** — the route ignores `category`/`brand` params
   even though `getProducts()` supports them; exposing them is a 3-line change.
4. **Native Google Sign-In** — needs a small endpoint that accepts a Google ID token and creates
   a NextAuth session, or use the webview flow described in §3.3.
5. **`POST /api/contact` is a no-op** (logs only) — wire it to email/DB before exposing in the app.
6. **Push notifications** — server currently uses Pusher for admin realtime only; customer push
   (FCM/APNs) would be a new addition.

---

*Generated from the actual route handlers in `src/app/api/` — July 2026. If routes change,
regenerate this doc.*
