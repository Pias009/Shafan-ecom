export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="glass glass-3d ring-icy rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          Payment success
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Thanks — your payment is complete
        </div>
        <div className="mt-3 text-sm text-white/70">
          Next step: we’ll create the order in the DB and show courier tracking in your dashboard.
        </div>
      </div>
    </div>
  );
}

