export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="glass glass-3d ring-icy rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">Cart</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Your cart</div>
        <div className="mt-3 text-sm text-white/70">
          Cart + checkout will be wired next (Stripe + coupon codes + address validation).
        </div>
      </div>
    </div>
  );
}

