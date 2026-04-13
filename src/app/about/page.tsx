<<<<<<< HEAD
import { Metadata } from "next";
import { ArrowRight, Shield, Heart, Sparkles, Globe, Award, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Shafan",
  description: "Shafan Global - Your trusted skincare partner bringing authentic beauty products from around the world.",
=======
import { Metadata } from 'next';
import { Shield, Heart, Globe, Star, Sparkles, CheckCircle, Target, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Shafan',
  description: 'Shafan Global - UAE-based skincare and cosmetics reseller bringing authentic, high-quality beauty products to the Middle East.',
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
};

const skinConcerns = [
  "Acne & breakouts",
  "Dark spots & pigmentation",
  "Melasma & uneven tone",
  "Dryness & dehydration",
<<<<<<< HEAD
  "Overall skin health"
];

const values = [
  { icon: Shield, title: "Trust & Transparency", desc: "Honest communication and genuine products" },
  { icon: Award, title: "Quality Assurance", desc: "100% original from verified suppliers" },
  { icon: Heart, title: "Customer Satisfaction", desc: "Your skincare journey is our priority" },
  { icon: Globe, title: "Accessibility", desc: "World-class skincare, locally accessible" }
=======
  "Overall skin health",
];

const values = [
  { name: "Trust & Transparency", icon: Shield },
  { name: "Quality Assurance", icon: Award },
  { name: "Customer Satisfaction", icon: Heart },
  { name: "Accessibility", icon: Globe },
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
];

export default function AboutPage() {
  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
                <span className="font-medium text-black">{concern}</span>
              </div>
            ))}
          </div>
        </section>

<<<<<<< HEAD
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
=======
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
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
      </div>
    </div>
  );
}
