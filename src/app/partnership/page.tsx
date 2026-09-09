"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Handshake, Building2, Truck, Mail, Phone, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    partnershipType: "supplier",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thank you! Our partnership team will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 pb-20">
      {/* Top Hero */}
      <div className="bg-[#0c3a32] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
            <Handshake size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
              Grow With Shanfa Global
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
            Partnership & Supplier Opportunities
          </h1>
          <p className="mt-4 text-emerald-100/80 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
            Join hands with AL SHANFA GENERAL TRADING CO. L.L.C. We collaborate with authorized brand manufacturers, distributors, and logistics partners across UAE, Kuwait, Saudi Arabia, and Europe.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c3a32] flex items-center justify-center mb-3">
              <Building2 size={20} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Brand Distribution</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Expand your authentic skincare or beauty brand into premium GCC markets with dedicated warehousing and retail reach.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c3a32] flex items-center justify-center mb-3">
              <Truck size={20} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Supplier Relations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We procure directly from authorized Korean, French, and international cosmetic distributors under strict authenticity agreements.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c3a32] flex items-center justify-center mb-3">
              <Handshake size={20} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">B2B & Wholesale</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Wholesale inquiries for clinics, certified dermatologists, and retail boutiques across Dubai and Kuwait.
            </p>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-black/5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submit a Partnership Inquiry</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-8">
              Fill out the form below or write directly to our corporate desk at{" "}
              <a href="mailto:info@shanfagroup.com" className="text-emerald-700 font-bold underline">
                info@shanfagroup.com
              </a>
            </p>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-900 space-y-3">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <h3 className="font-bold text-lg">Inquiry Received</h3>
                <p className="text-xs text-emerald-700">
                  Our commercial representative will review your profile and respond within 1-2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Company / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Your Company Name"
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#0c3a32] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#0c3a32] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="partner@company.com"
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#0c3a32] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+971 50 000 0000"
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#0c3a32] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Partnership Category
                  </label>
                  <select
                    value={formData.partnershipType}
                    onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#0c3a32] transition bg-white"
                  >
                    <option value="supplier">Brand Supplier / Manufacturer</option>
                    <option value="wholesale">Wholesale / Clinic Purchase</option>
                    <option value="logistics">Logistics & Courier Service</option>
                    <option value="other">Other Commercial Collaboration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Proposal / Product Information
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide a brief overview of your products, brand catalog, or distribution territory..."
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#0c3a32] transition"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#0c3a32] hover:bg-[#082822] text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-md transition-all hover:scale-[1.02] active:scale-95"
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
