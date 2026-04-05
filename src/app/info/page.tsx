import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info - Shafan",
  description: "Privacy Policy, Terms of Service, Shipping Info, Refund Policy, and About Us",
};

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `At Shafan, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you shop with us across the Gulf region including UAE, Kuwait, Saudi Arabia, Bahrain, Qatar, and Oman.

We collect information such as your name, contact details, payment information, and shopping preferences to provide you with a personalized shopping experience. Your data is encrypted using industry-standard protocols and is never shared with third parties except as necessary to process your orders.

By using our website, you consent to the collection and use of information in accordance with this policy. We retain your data only for as long as necessary to fulfill your orders and comply with legal obligations.`,
  },
  {
    id: "terms",
    title: "Terms of Service",
    content: `Welcome to Shafan. By accessing and purchasing from our website, you agree to be bound by the following terms and conditions.

All products are subject to availability. We reserve the right to refuse service to anyone for any reason at any time. Prices and promotions are subject to change without notice. For our Gulf customers in UAE, Kuwait, Saudi Arabia, Bahrain, Qatar, and Oman, all prices are displayed in local currencies.

Intellectual property rights for all content on this website remain with Shafan. You may not reproduce, distribute, or modify any content without our explicit written consent.`,
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
    title: "Refund Policy",
    content: `We want you to be completely satisfied with your Shafan purchase. If for any reason you are not happy with your order, we offer a flexible refund policy across all Gulf countries.

To initiate a return, please contact our customer service team within 14 days of receiving your order. Products must be unused, in original packaging, and in resalable condition. Once we receive your return, refunds are processed within 5-7 business days.

For defective products, we offer full refunds or replacements at no additional cost. Please note that shipping charges may apply for non-defective returns.`,
  },
  {
    id: "about",
    title: "About Us",
    content: `Shafan is a premium skincare brand dedicated to helping you achieve radiant, healthy skin. Founded with a mission to bring nature's finest ingredients to the Gulf region, we serve customers across UAE, Kuwait, Saudi Arabia, Bahrain, Qatar, and Oman.

Our products are crafted using carefully selected natural ingredients, formulated by skincare experts to address diverse skin concerns. We believe in transparency, quality, and sustainability in everything we do.

At Shafan, customer satisfaction is our top priority. Our dedicated support team is always ready to assist you with any questions or concerns. Join thousands of satisfied customers who have transformed their skincare routines with Shafan.`,
  },
];

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-cream text-black font-body">
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
