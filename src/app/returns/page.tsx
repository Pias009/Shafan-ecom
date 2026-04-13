<<<<<<< HEAD
import { Metadata } from "next";
import { ArrowRight, Package, Clock, Shield, RefreshCw, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Exchanges | Shafan",
  description: "Learn about Shafan's return and exchange policy. Easy returns within 14 days for unused products in original packaging.",
};

const returnSteps = [
  { title: "Contact Us", description: "Reach out to our customer service team within 14 days of delivery" },
  { title: "Pack Item", description: "Place the item in original packaging with all tags attached" },
  { title: "Ship Back", description: "Use our provided return label or arrange pickup" },
  { title: "Get Refund", description: "Receive your refund within 5-7 business days after inspection" },
];

export default function ReturnsPage() {
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
          <h1 className="font-display text-4xl md:text-5xl font-black">Returns & Exchanges</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Intro */}
        <div className="text-center mb-12">
          <p className="text-black/60 text-lg">
            We want you to love your purchase. If you're not completely satisfied, we offer easy returns within 14 days.
          </p>
        </div>

        {/* Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-black mb-6">How to Return</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {returnSteps.map((step, idx) => (
              <div key={idx} className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">{step.title}</h3>
                    <p className="text-sm text-black/60">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Policy Details */}
        <section className="space-y-6">
          <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-black" />
              <h3 className="font-bold text-black text-lg">Eligibility</h3>
            </div>
            <ul className="space-y-3 text-black/60">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Items must be unused, in original packaging</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Products must be in resalable condition</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Returns requested within 14 days of delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Proof of purchase required</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-black" />
              <h3 className="font-bold text-black text-lg">Refunds</h3>
            </div>
            <ul className="space-y-3 text-black/60">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Refunds processed within 5-7 business days after inspection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Original shipping charges may apply for non-defective returns</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Defective products: full refund or replacement at no cost</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-black" />
              <h3 className="font-bold text-black text-lg">Exchanges</h3>
            </div>
            <ul className="space-y-3 text-black/60">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Same product in different size/color: subject to availability</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                <span>Different product: return original + place new order</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel-heavy rounded-2xl p-6 border border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-amber-500" />
              <h3 className="font-bold text-black">Questions?</h3>
            </div>
            <p className="text-black/60">
              Contact our customer service at <Link href="/contact" className="text-black underline hover:text-black/70">support@shanfaglobal.com</Link> or via WhatsApp for assistance.
            </p>
          </div>
=======
import { Metadata } from 'next';
import { RotateCcw, CheckCircle, XCircle, Truck, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Cancellation Policy | Shafan',
  description: 'Returns & Cancellation Policy for Shafan Global Orders.',
};

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl md:text-5xl font-black text-black mb-12 tracking-tight">
        Returns & Cancellation Policy
      </h1>

      <div className="space-y-8">
        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-500" />
            Returns
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>Return within <strong>2 days</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>Only <strong>defective/damaged items</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>Must be <strong>unused</strong></span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            Refund
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
              <span>Original payment method</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
              <span>After inspection</span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Cancellation
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>Not allowed after confirmation</span>
            </li>
          </ul>
        </section>

        <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Shipping
          </h2>
          <ul className="space-y-3 text-black/60">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Free only for <strong>approved defective returns</strong></span>
            </li>
          </ul>
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
        </section>
      </div>
    </div>
  );
}
