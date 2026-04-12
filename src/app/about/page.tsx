import { Metadata } from 'next';
import { Shield, Heart, Globe, Star, Sparkles, CheckCircle, Target, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Shafan',
  description: 'Shafan Global - UAE-based skincare and cosmetics reseller bringing authentic, high-quality beauty products to the Middle East.',
};

const skinConcerns = [
  "Acne & breakouts",
  "Dark spots & pigmentation",
  "Melasma & uneven tone",
  "Dryness & dehydration",
  "Overall skin health",
];

const values = [
  { name: "Trust & Transparency", icon: Shield },
  { name: "Quality Assurance", icon: Award },
  { name: "Customer Satisfaction", icon: Heart },
  { name: "Accessibility", icon: Globe },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
          About Us
        </h1>
      </div>
      <p className="text-black/60 text-lg mb-12 max-w-2xl">
        <strong>Shafan Global</strong>
      </p>

      <div className="space-y-8">
        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <p className="text-black/70 leading-relaxed text-lg">
            Shafan Global is a UAE-based skincare and cosmetics reseller dedicated to bringing authentic, high-quality beauty products from globally trusted brands to customers across the Middle East.
          </p>
          <p className="text-black/70 leading-relaxed mt-4">
            We source products from the <strong>USA, Korea, Canada</strong>, and other international markets, ensuring only genuine and effective solutions.
          </p>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Our Mission
          </h2>
          <p className="text-black/70 leading-relaxed text-lg">
            To make world-class skincare <strong>accessible, affordable, and trustworthy</strong>.
          </p>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            Our Promise
          </h2>
          <p className="text-black/70 leading-relaxed text-lg">
            100% original products from <strong>verified suppliers</strong>.
          </p>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            We Focus on Solving
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skinConcerns.map((concern, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <CheckCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="font-medium text-black">{concern}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="font-bold text-black">{value.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-violet-200 bg-violet-50/50">
          <div className="flex items-start gap-3">
            <Users className="w-6 h-6 text-violet-500 shrink-0 mt-1" />
            <div>
              <p className="text-black/70 leading-relaxed text-lg">
                We are not just a reseller — we are your <strong>skincare partner</strong>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
