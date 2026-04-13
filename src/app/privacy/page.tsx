import { Metadata } from "next";
import { ArrowRight, Shield, Eye, Edit3, Trash2, CreditCard, Truck, Smartphone, User, Mail, MapPin, ShoppingBag, AlertTriangle, Cookie, Database, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Security Policy | Shafan",
  description: "Shafan Privacy & Security Policy - How we collect, use, and protect your data.",
};

const collectData = [
  { icon: User, item: "Name, phone number, email address" },
  { icon: MapPin, item: "Billing and shipping address" },
  { icon: ShoppingBag, item: "Order and transaction details" },
  { icon: Smartphone, item: "Device and browser information (IP address, cookies)" }
];

const usageData = [
  { icon: ShoppingBag, item: "Process and deliver orders" },
  { icon: User, item: "Provide customer support" },
  { icon: Shield, item: "Improve website performance" },
  { icon: AlertTriangle, item: "Prevent fraud and unauthorized activity" }
];

const shareData = [
  { icon: CreditCard, item: "Payment gateways" },
  { icon: Truck, item: "Delivery partners" },
  { icon: Shield, item: "Fraud prevention services" }
];

const rightsData = [
  { icon: Eye, item: "Access to your personal data" },
  { icon: Edit3, item: "Correction or deletion of data" },
  { icon: Database, item: "Export of stored information" }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-black text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowRight className="rotate-180" size={14} /> Back to Home
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-black">Privacy & Security Policy</h1>
          <p className="text-white/60 mt-2">Shanha Global - We are committed to protecting your personal data and ensuring a safe shopping experience.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Section 1: Information We Collect */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
            <h2 className="text-xl font-black text-black">Information We Collect</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <p className="font-bold text-black mb-4">We may collect the following information:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {collectData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/5 rounded-xl p-3">
                  <item.icon className="w-5 h-5 text-black/60 shrink-0" />
                  <span className="font-medium text-black text-sm">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: How We Use */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
            <h2 className="text-xl font-black text-black">How We Use Your Information</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <p className="font-bold text-black mb-4">We use your data to:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {usageData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/5 rounded-xl p-3">
                  <item.icon className="w-5 h-5 text-black/60 shrink-0" />
                  <span className="font-medium text-black text-sm">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Data Protection */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
            <h2 className="text-xl font-black text-black">Data Protection</h2>
          </div>
          <div className="bg-green-50 rounded-3xl p-6 border border-green-200">
            <p className="font-bold text-black mb-4">We implement strict security measures to protect your data from:</p>
            <ul className="space-y-2 text-black/70 mb-4">
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>Unauthorized access</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>Misuse or alteration</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>Loss or disclosure</span>
              </li>
            </ul>
            <div className="p-3 bg-white rounded-xl">
              <p className="text-sm text-black/60">However, no online system is 100% secure.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Cookies */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">4</span>
            <h2 className="text-xl font-black text-black">Cookies</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <p className="font-bold text-black mb-4">Our website uses cookies to:</p>
            <ul className="space-y-2 text-black/60 mb-4">
              <li className="flex items-start gap-2">
                <Cookie className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                <span>Improve user experience</span>
              </li>
              <li className="flex items-start gap-2">
                <Cookie className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                <span>Remember login and preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <Cookie className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                <span>Enhance checkout process</span>
              </li>
            </ul>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-black/70">Users may disable cookies in browser settings.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Data Sharing */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">5</span>
            <h2 className="text-xl font-black text-black">Data Sharing</h2>
          </div>
          <div className="bg-green-50 rounded-3xl p-6 border border-green-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <p className="font-bold text-black">We do not sell or rent personal data.</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <p className="font-bold text-black mb-4">We may share limited information with:</p>
            <div className="grid md:grid-cols-3 gap-3">
              {shareData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/5 rounded-xl p-3">
                  <item.icon className="w-5 h-5 text-black/60 shrink-0" />
                  <span className="font-medium text-black text-sm">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Your Rights */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">6</span>
            <h2 className="text-xl font-black text-black">Your Rights</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <p className="font-bold text-black mb-4">You may request:</p>
            <div className="grid md:grid-cols-3 gap-3">
              {rightsData.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-black/5 rounded-xl p-3">
                  <item.icon className="w-5 h-5 text-black/60 shrink-0 mt-0.5" />
                  <span className="font-medium text-black text-sm">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Third-Party Services */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">7</span>
            <h2 className="text-xl font-black text-black">Third-Party Services</h2>
          </div>
          <div className="bg-black/5 rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-black/60 shrink-0 mt-0.5" />
              <p className="text-black/60">External embedded content (e.g., videos or links) may collect data according to their own privacy policies.</p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="mt-12 p-6 bg-black text-white rounded-2xl">
          <h3 className="font-bold text-lg mb-2">Questions?</h3>
          <p className="text-white/70 text-sm mb-4">Contact us for any privacy concerns.</p>
          <Link href="/contact" className="text-sm font-bold underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
