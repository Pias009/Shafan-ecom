import { Metadata } from 'next';
import { RotateCcw, CheckCircle, XCircle, Mail, Clock, Truck, Shield, RefreshCw, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Cancellation Policy | Shafa Global',
  description: 'Returns & Cancellation Policy for Shafa Global Orders (UAE & GCC)',
};

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white/40 backdrop-blur-sm">
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
              Returns & Cancellation Policy
            </h1>
          </div>
          <p className="text-black/60 text-lg mb-4 max-w-2xl">
            <strong>Shafa Global – Orders (UAE & GCC)</strong>
          </p>
          <p className="text-black/50 text-sm mb-12 max-w-2xl">
            We aim to ensure customer satisfaction with every purchase. By placing an order on our website, you agree to the terms below.
          </p>

          <div className="space-y-8">
            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                1. Return Eligibility
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span><strong>1.1</strong> Returns must be requested within <strong>2 days</strong> of delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span><strong>1.2</strong> Only <strong>defective or damaged items</strong> are eligible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span><strong>1.3</strong> Products must be <strong>unused</strong> and in <strong>original packaging</strong>.</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                2. Non-Returnable Items
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Clearance / sale items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Gift cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Opened or used products</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                3. Return Process
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span>Email: <a href="mailto:support@shanfaglobal.com" className="text-blue-600 hover:underline">support@shanfaglobal.com</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span>Provide order details and proof of issue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span>Await return approval from our team</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-black/50 italic">
                Approved items must be returned as instructed.
              </p>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                4. Refund Policy
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span><strong>4.1</strong> Refunds are issued to the <strong>original payment method only</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span><strong>4.2</strong> All returned items are <strong>inspected</strong> before approval.</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                5. Refund Processing Time
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-black">Online Payments</h3>
                      <p className="text-sm text-black/60">Credit/Debit Card, Apple Pay, etc.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-black">5 working days + 5-7 days bank processing</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">💵</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-black">COD Orders</h3>
                      <p className="text-sm text-black/60">Cash on Delivery</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-black">14-21 working days</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                6. Order Cancellation
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span><strong>6.1</strong> Orders cannot be cancelled once confirmed or shipped.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span><strong>6.2</strong> Shafa Global may cancel orders due to:</span>
                </li>
                <li className="ml-6 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Stock issues</span>
                </li>
                <li className="ml-6 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Pricing errors</span>
                </li>
                <li className="ml-6 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Suspicious transactions</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-500" />
                7. Shipping for Returns
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                  <span>Free return shipping for <strong>approved defective items only</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                  <span>Otherwise, customers may be responsible for return shipping.</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-amber-200 bg-amber-50/50">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Amendments
              </h2>
              <p className="text-black/60">
                This policy may be updated at any time without prior notice.
              </p>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-black mb-2">Need Help?</h3>
                  <p className="text-sm text-black/60">
                    For return-related inquiries, contact us at <a href="mailto:support@shanfaglobal.com" className="text-rose-600 hover:underline">support@shanfaglobal.com</a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
