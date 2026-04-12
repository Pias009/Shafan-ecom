import { Metadata } from 'next';
import { FileText, CreditCard, ShoppingBag, Shield, Scale, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Shafan',
  description: 'Terms & Conditions for Shafan Global Orders.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl md:text-5xl font-black text-black mb-12 tracking-tight">
        Terms & Conditions
      </h1>

      <div className="space-y-8">
        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            1. General Use
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
              <span>Must be <strong>18+</strong> or under supervision</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
              <span>Terms can be <strong>updated anytime</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            2. Products & Pricing
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>Subject to <strong>availability</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>Prices may <strong>change</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            3. Orders
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Orders may be <strong>cancelled</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Cannot modify <strong>after confirmation</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            4. Payments
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>Online & <strong>COD supported</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>Payment required <strong>before dispatch</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            5. Liability
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Not responsible for <strong>indirect damage</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-500" />
            6. Governing Law
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              <span><strong>UAE Law</strong> applies</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
