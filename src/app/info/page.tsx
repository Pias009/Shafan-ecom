import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info - Shafan",
  description: "Privacy Policy, Terms of Service, Shipping Info, Refund Policy, and About Us",
};

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy – Shanfa Global",
    content: `Cookies
• Improve experience
• Login/Prefs
• Checkout
Settings available in browser.

Data Sharing
Partners:
• Payment
• Delivery
• Fraud

Your Rights
• Access
• Correct/Delete
• Export`,
  },
  {
    id: "terms",
    title: "Terms & Conditions – Shanfa Global",
    content: `1. General Use
• Must be 18+ or under adult supervision
• Terms can be updated at any time without notice

2. Products & Pricing
• All products are subject to availability
• Prices may change without prior notice

3. Orders
• Orders may be cancelled before dispatch
• Cannot be modified after confirmation

4. Payments
• Online payment and Cash on Delivery (COD) supported
• Payment required before dispatch

5. Liability
• Not responsible for indirect or consequential damages

6. Governing Law
• UAE Law applies to all terms and disputes`,
  },
  {
    id: "shipping",
    title: "Shipping Information",
    content: `Shafan offers reliable shipping across all Gulf countries. Our delivery network covers UAE, Kuwait, Saudi Arabia, Bahrain, Qatar, and Oman with competitive shipping rates and fast delivery times.

Standard delivery takes 3-5 business days within the same country and 5-10 business days for cross-border shipments. Express shipping options are available for urgent orders. Free shipping is offered on orders exceeding the minimum threshold in each country.

All shipments are carefully packaged to ensure products arrive in perfect condition. Real-time tracking is available for all orders.`,
  },
  {
    id: "refund",
    title: "Returns & Cancellation Policy – Shanfa Global",
    content: `Eligibility Rules:
• Request within 2 days
• Defective/Damaged only
• Unused in original packaging

Non-Returnable:
• Sale items
• Gift cards
• Opened products

Refund Timelines:
• Online: 5 days + bank time
• COD: 14-21 working days

Cancellation:
• Not allowed after confirmation.`,
  },
  {
    id: "about",
    title: "About Us – Shanfa Global",
    content: `Shanfa Global is a UAE-based skincare and cosmetics reseller dedicated to bringing authentic, high-quality beauty products from globally trusted brands to customers across the Middle East.

We source products from the USA, Korea, Canada, and other international markets, ensuring only genuine and effective solutions.

Our Mission: To make world-class skincare accessible, affordable, and trustworthy.

Our Promise: 100% original products from verified suppliers.

We focus on solving:
• Acne & breakouts
• Dark spots & pigmentation
• Melasma & uneven tone
• Dryness & dehydration
• Overall skin health

Our Values:
• Trust & Transparency
• Quality Assurance
• Customer Satisfaction
• Accessibility

We are not just a reseller — we are your skincare partner.`,
  },
];

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm text-black font-body">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-black text-black mb-4">
            Information Center
          </h1>
          <p className="text-black/60 max-w-xl mx-auto">
            Everything you need to know about Shafan policies, shipping, and more.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Glassmorphic Sidebar - Table of Contents */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 glass-panel rounded-2xl p-4 border border-black/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">
                Quick Links
              </h3>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="px-3 py-2 text-sm font-medium text-black/70 hover:text-black hover:bg-black/5 rounded-xl transition-all"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="glass-panel rounded-2xl p-6 md:p-8 border border-black/5"
              >
                <h2 className="font-display text-xl md:text-2xl font-bold text-black mb-4">
                  {section.title}
                </h2>
                <div className="prose prose-sm max-w-none text-black/70 leading-relaxed">
                  {section.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
