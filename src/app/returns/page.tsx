import { Metadata } from 'next';
import { RotateCcw, CheckCircle, XCircle, Truck, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Cancellation Policy | Shafan',
  description: 'Returns & Cancellation Policy for Shafan Global Orders.',
};

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl md:text-5xl font-black text-black mb-12 tracking-tight">
        Returns & Cancellation Policy
      </h1>

      <div className="space-y-8">
        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-500" />
            Returns
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>Return within <strong>2 days</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>Only <strong>defective/damaged items</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>Must be <strong>unused</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            Refund
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
              <span>Original payment method</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
              <span>After inspection</span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Cancellation
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>Not allowed after confirmation</span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Shipping
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Free only for <strong>approved defective returns</strong></span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
