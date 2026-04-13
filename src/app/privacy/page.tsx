import { Metadata } from 'next';
import { Shield, Database, CreditCard, Truck, UserCheck, Lock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy & Security Policy | Shafan',
  description: 'Privacy & Security Policy for Shafan Global - How we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white/40 backdrop-blur-sm">
      <main className="flex-1 pt-8 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
              Privacy & Security Policy
            </h1>
          </div>

          <div className="space-y-8">
            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-500" />
                We Collect
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Name, phone, email</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Address & order details</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Device info (IP, cookies)</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Usage
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Order processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Customer support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Fraud prevention</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-green-200 bg-green-50/50">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Data Protection
              </h2>
              <p className="text-black/70 leading-relaxed">
                We <strong>DO NOT sell</strong> your data.
              </p>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                We May Share With
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Payment gateways</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Delivery partners</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-500" />
                User Rights
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Access data</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Edit/delete data</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-amber-200 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-black mb-2">Contact Us</h3>
                  <p className="text-sm text-black/60">
                    For privacy-related inquiries, contact us at <a href="mailto:support@shanfaglobal.com" className="text-violet-600 hover:underline">support@shanfaglobal.com</a>
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
