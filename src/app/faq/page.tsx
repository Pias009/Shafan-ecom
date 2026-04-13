import { Metadata } from "next";
import { ArrowRight, HelpCircle, Package, Truck, CreditCard, Shield, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Shafan",
  description: "Frequently asked questions about Shafan orders, shipping, payments, returns, and products.",
};

const faqCategories = [
  {
    title: "Orders & Products",
    icon: Package,
    questions: [
      {
        q: "How do I place an order?",
        a: "Simply browse our collection, add items to your cart, and proceed to checkout. You can also order via WhatsApp for faster assistance."
      },
      {
        q: "Can I modify or cancel my order?",
        a: "Yes, you can modify or cancel your order within 1 hour of placing it. Contact our customer service immediately with your order number."
      },
      {
        q: "How do I know my order is confirmed?",
        a: "You'll receive an email confirmation with your order number and details. You can also track your order status on our website."
      },
    ]
  },
  {
    title: "Shipping & Delivery",
    icon: Truck,
    questions: [
      {
        q: "What countries do you ship to?",
        a: "We ship across the GCC region including UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, and Oman."
      },
      {
        q: "How long does delivery take?",
        a: "UAE: 2-4 business days. Other GCC countries: 3-7 business days. Express shipping options available for urgent orders."
      },
      {
        q: "Is free shipping available?",
        a: "Yes! Free shipping is available on orders above the minimum threshold per country (e.g., AED 150 for UAE)."
      },
      {
        q: "How can I track my order?",
        a: "You'll receive tracking details via SMS and email once your order is shipped. You can also track via our website."
      },
    ]
  },
  {
    title: "Payments",
    icon: CreditCard,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit/debit cards, Apple Pay, Google Pay, Tabby, Tamara, and cash on delivery (COD)."
      },
      {
        q: "Is cash on delivery available?",
        a: "Yes! COD is available across all GCC countries with a AED 10 fee applicable."
      },
      {
        q: "Are my payment details secure?",
        a: "Absolutely. We use 256-bit SSL encryption and PCI DSS compliant payment gateways."
      },
    ]
  },
  {
    title: "Returns & Refunds",
    icon: RefreshCw,
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer returns within 14 days of delivery. Items must be unused, in original packaging, and in resalable condition."
      },
      {
        q: "How do I initiate a return?",
        a: "Contact our customer service team within 14 days. We'll guide you through the process and provide return instructions."
      },
      {
        q: "When will I get my refund?",
        a: "Refunds are processed within 5-7 business days after we receive and inspect your returned item."
      },
    ]
  },
];

export default function FAQPage() {
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
          <h1 className="font-display text-4xl md:text-5xl font-black">Frequently Asked Questions</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Intro */}
        <div className="text-center mb-12">
          <p className="text-black/60 text-lg">
            Have questions? Find answers to the most common questions below.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category) => (
            <section key={category.title}>
              <div className="flex items-center gap-3 mb-6">
                <category.icon className="w-6 h-6 text-black" />
                <h2 className="text-2xl font-black text-black">{category.title}</h2>
              </div>
              <div className="space-y-4">
                {category.questions.map((item, idx) => (
                  <details 
                    key={idx} 
                    className="glass-panel-heavy rounded-2xl border border-black/5 group"
                  >
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="font-bold text-black pr-4">{item.q}</span>
                      <HelpCircle className="w-5 h-5 text-black/30 group-hover:text-black shrink-0 transition-colors" />
                    </summary>
                    <div className="px-6 pb-6 pt-0 text-black/60">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 glass-panel-heavy rounded-2xl p-8 border border-black/5 text-center">
          <MessageCircle className="w-10 h-10 text-black mx-auto mb-4" />
          <h3 className="font-bold text-black text-xl mb-2">Still have questions?</h3>
          <p className="text-black/60 mb-6">Our customer service team is here to help you.</p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-black/80 transition-colors"
          >
            Contact Us <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
