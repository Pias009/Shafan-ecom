# Mystery Box Incentive — Strategy Plan

**Offer:** "Add 2 more items and get a Mystery Box FREE", shown at checkout (`/cart`).
**Goal:** get people to buy more items per order without discounting the products themselves.
**Status:** the checkout banner is built. Orders do not record the reward yet; see Phase 0.

---

## 1. Why this offer

| Lever | Coupon (e.g. −15%) | Free shipping threshold | **Mystery Box** |
|---|---|---|---|
| Cost to us | Margin on *every* item | Fixed delivery cost | Box cost only, and we choose what goes in |
| Trains discount-hunting | Yes | Somewhat | No |
| Clears slow stock | No | No | **Yes**, boxes can use overstock and samples |
| Creates content to share | No | No | **Yes**, unboxing videos |

People value a surprise gift more than a discount worth the same amount. It also lets us turn slow-moving stock and free brand samples into a reward.

## 2. How it works

- **Trigger:** the cart holds **3 or more items** (`NEXT_PUBLIC_MYSTERY_BOX_THRESHOLD`). For the usual 1-item cart, that means "add 2 more".
- **Counting:** each unit counts, but only items priced for the shopper's country (`hasValidPrice`).
- **Off switch:** set `NEXT_PUBLIC_MYSTERY_BOX_PROMO=false` and redeploy.
- **Recommended guardrail (Phase 1):** also require a minimum subtotal per country, so nobody qualifies by adding the three cheapest items.

| Country | Suggested minimum subtotal |
|---|---|
| KW / BH / OM | 15 KWD / 15 BHD / 15 OMR |
| AE / SA / QA | 150 AED / 150 SAR / 150 QAR |

Set the real numbers from your current average order value: about **1.3× today's median order**.

## 3. Box economics

Box cost **C** (contents at cost + packaging + extra shipping weight).
Margin earned on each extra item **M**. Share of qualifying orders that **would have had 3 or more items anyway** **s**. We pay for their boxes without earning anything extra.

> The offer pays off when **extra items per qualifying order × M > C**.
> On qualifying orders, the extra-items figure is roughly 2 × (1 − s).

Example: C = 2 KWD, M = 3 KWD, s = 40% → 2 × 0.6 × 3 = **3.6 KWD earned against 2 KWD spent ✅**

**What goes in the box (keeps C low):**
1. Free brand samples and travel sizes (ask partner brands; they get sampling for free)
2. Overstock and slow movers, at least 6 months before expiry (never near-expiry skincare)
3. One "hero" item in about 1 in 10 boxes (a full-size best seller). This drives the excitement and unboxing posts.
4. A card with a QR code for a *next-order* coupon. This brings the buyer back.

Rule of thumb: **box cost ≤ 8–10% of a qualifying order's value**, and contents marked as **"worth up to X"**. Never overstate the value (consumer protection rules in the GCC).

## 4. Rollout

### Phase 0 — Record the reward on the order (must ship before telling customers)
The banner promises a box, but **orders don't record it yet**. Without this, staff won't know to pack one.
- `/api/create-order`: work out who qualifies **on the server** with `mysteryBoxProgress()` from `src/lib/mystery-box.ts`. Never trust the browser.
- Store it on the order: a `promoGifts` field, or a zero-price "Mystery Box" line item.
- Show it in the admin order view and on the packing slip, the confirmation email and `/checkout/success`.
- Returns policy: the box is a gift. Returning items afterwards doesn't require sending the box back.

### Phase 1 — Soft launch (1 week, Kuwait only)
- Add the minimum-subtotal guardrail.
- Check that every qualifying order ships with a box (ops checklist).

### Phase 2 — A/B test (2–4 weeks, all GCC)
- 50/50 split via a cookie. The control group doesn't see the banner.
- Run it for at least 2 weeks, with about 1,000 checkouts per group.

### Phase 3 — Scale and seasons
- **White Friday (late Nov):** "White Friday Mystery Box" with a guaranteed hero item.
- **Ramadan / Eid:** themed gift boxes, with a higher threshold (4 items) at peak demand.
- Change the box theme every month so returning customers stay curious.
- Show "2 more for a Mystery Box" earlier: in the cart drawer, on product pages and in the floating cart button.

## 5. Measurement

Already tracked: GA4 `view_promotion` and `select_promotion` (`creative_slot: checkout_mystery_box`).

| Metric | Target | Watch for |
|---|---|---|
| Items per order | **+15–25%** | Main goal |
| Average order value | +10–20% | |
| Checkout conversion | **No drop greater than 1 point** | The "Add more" button takes people *away* from checkout |
| % of orders qualifying | 25–40% | Under 15%: threshold too high. Over 60%: too easy, we're subsidising |
| Box cost / revenue | ≤ 3% | |
| 60-day repeat rate (box recipients vs control) | +5 points | Long-term payoff |

To add: a `mystery_box_unlocked` event, and the reward attached to `trackPurchase`.

## 6. Risks and fixes

| Risk | Fix |
|---|---|
| Shoppers leave checkout to browse and don't come back | **Phase 1.5:** show 3–4 cheap add-on products *inside* the banner with one-tap "Add", so nobody leaves the page |
| Abuse (add cheap items, return them later) | Minimum subtotal plus the gift-not-returnable rule |
| Boxes run out | Turn off with `NEXT_PUBLIC_MYSTERY_BOX_PROMO=false`; set a stock alert |
| Disappointment ("box was junk") | Minimum value promise, the hero-item chance, and quality checks on contents |
| Distraction or motion sensitivity | One animated element; respects `prefers-reduced-motion` (already built) |

## 7. Implementation reference

- `src/lib/mystery-box.ts`: settings and the qualification check (shared by browser and server)
- `src/components/checkout/MysteryBoxPromo.tsx`: glass card with the 3D cube, English and Arabic, accessible progress bar
- `src/app/cart/page.tsx`: mounted below the items list (top of the page on mobile, beside the summary on desktop)
