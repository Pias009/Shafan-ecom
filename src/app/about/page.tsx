import { Metadata } from "next";
import { ArrowRight, Shield, Heart, Sparkles, Globe, Award, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | SHANFA",
  description: "SHANFA GLOBAL - Your trusted skincare partner bringing authentic beauty products from around the world.",
};

const skinConcerns = [
  "Acne & breakouts",
  "Dark spots & pigmentation",
  "Melasma & uneven tone",
  "Dryness & dehydration",
  "Overall skin health"
];

const values = [
  { icon: Shield, title: "Trust & Transparency", desc: "Honest communication and genuine products" },
  { icon: Award, title: "Quality Assurance", desc: "100% original from verified suppliers" },
  { icon: Heart, title: "Customer Satisfaction", desc: "Your skincare journey is our priority" },
  { icon: Globe, title: "Accessibility", desc: "World-class skincare, locally accessible" }
];

export default function AboutPage() {
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
          <h1 className="font-display text-4xl md:text-5xl font-black">About Us</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Intro */}
        <section className="mb-12">
          <p className="text-black/70 text-lg leading-relaxed">
            Shanfa Global is a UAE-based skincare and cosmetics reseller dedicated to bringing authentic, high-quality beauty products from globally trusted brands to customers across the Middle East.
          </p>
          <p className="text-black/70 text-lg leading-relaxed mt-4">
            We source products from the USA, Korea, Canada, and other international markets, ensuring only genuine and effective solutions.
          </p>
        </section>

        {/* Mission & Promise */}
        <section className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-black text-white rounded-3xl p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Our Mission</h2>
            <p className="font-bold text-xl">To make world-class skincare accessible, affordable, and trustworthy.</p>
          </div>
          <div className="bg-green-50 rounded-3xl p-8 border border-green-200">
            <h2 className="text-xs font-black uppercase tracking-widest text-green-600 mb-4">Our Promise</h2>
            <p className="font-bold text-xl text-black">100% original products from verified suppliers.</p>
          </div>
        </section>

        {/* Skin Concerns */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-black" />
            <h2 className="text-2xl font-black text-black">We Focus On Solving</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {skinConcerns.map((concern, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-black/5 rounded-2xl p-4">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <span className="font-medium text-black">{concern}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-black" />
            <h2 className="text-2xl font-black text-black">Our Values</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {values.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">{item.title}</h3>
                  <p className="text-sm text-black/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="text-center py-8 border-t border-black/10">
          <p className="text-2xl font-black text-black italic">
            "We are not just a reseller — we are your skincare partner."
          </p>
        </section>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-black/80 transition-colors"
          >
            Get in Touch <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
