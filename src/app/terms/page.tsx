import { Metadata } from "next";
import { ArrowRight, Shield, Package, CreditCard, AlertTriangle, Globe, Scale } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | SHANFA",
  description: "SHANFA Terms and Conditions - General use, products, orders, payments, liability, and governing law.",
};

const sections = [
  {
    num: "1",
    title: "General Use",
    icon: Shield,
    items: [
      "Must be 18+ or under supervision",
      "Terms can be updated anytime"
    ]
  },
  {
    num: "2",
    title: "Products & Pricing",
    icon: Package,
    items: [
      "Subject to availability",
      "Prices may change"
    ]
  },
  {
    num: "3",
    title: "Orders",
    icon: Package,
    items: [
      "Orders may be cancelled",
      "Cannot modify after confirmation"
    ]
  },
  {
    num: "4",
    title: "Payments",
    icon: CreditCard,
    items: [
      "Online & COD supported",
      "Payment required before dispatch"
    ]
  },
  {
    num: "5",
    title: "Liability",
    icon: AlertTriangle,
    items: [
      "Not responsible for indirect damage"
    ]
  },
  {
    num: "6",
    title: "Governing Law",
    icon: Scale,
    items: [
      "UAE Law applies"
    ]
  }
];

export default function TermsPage() {
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
          <h1 className="font-display text-4xl md:text-5xl font-black">Terms & Conditions</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <p className="text-black/60 text-lg mb-12">
          Please read these terms and conditions carefully before using our website or placing an order.
        </p>

        <div className="space-y-6">
          {sections.map((section) => (
            <section 
              key={section.num}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">
                  {section.num}
                </span>
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-black/40" />
                  <h2 className="text-xl font-black text-black">{section.title}</h2>
                </div>
              </div>
              <ul className="ml-13 space-y-2 text-black/60">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Last Updated */}
        <div className="mt-12 text-center text-sm text-black/40">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 text-center">
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-black/80 transition-colors"
          >
            Questions? Contact Us <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
