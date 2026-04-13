"use client";

import { ArrowLeft, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, MessageCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm">
      <div className="bg-black text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-black">Contact Us</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-black text-black mb-4">Get in Touch</h2>
              <p className="text-black/60 text-lg">
                Have a question? We&apos;d love to hear from you.
              </p>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-1">WhatsApp</p>
                <a href="https://wa.me/971547206046?text=Hi%20Shafa%20Global,%20I%20have%20a%20question." target="_blank" className="font-bold text-black hover:text-green-600 transition">
                  +971 54 720 6046
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 p-4 bg-black/5 rounded-2xl">
              <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                <Phone size={24} className="text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-1">Landline</p>
                <a href="tel:+971048387827" className="font-bold text-black hover:text-black/70 transition">
                  +971 04 838 7827
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 p-4 bg-black/5 rounded-2xl">
              <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                <Mail size={24} className="text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-1">Email</p>
                <a href="mailto:support@shanfaglobal.com" className="font-bold text-black hover:text-black/70 transition">
                  support@shanfaglobal.com
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 p-4 bg-black/5 rounded-2xl">
              <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                <MapPin size={24} className="text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-1">Address</p>
                <div className="font-bold text-black">
                  <div>AL Diyafa Shopping Center</div>
                  <div>AL Baada, Dubai</div>
                  <div>United Arab Emirates</div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs font-black uppercase tracking-widest text-black/30 mb-4">Follow Us</p>
              <div className="flex gap-3">
                <a href="https://wa.me/971547206046" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center hover:bg-green-500/20 transition" aria-label="WhatsApp">
                  <MessageCircle className="text-green-600" size={20} />
                </a>
                <a href="https://www.facebook.com/ShanfaGlobalArabia" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center hover:bg-blue-600/20 transition" aria-label="Facebook">
                  <Facebook className="text-blue-600" size={20} />
                </a>
                <a href="https://www.instagram.com/shanfa.global" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center hover:bg-pink-500/20 transition" aria-label="Instagram">
                  <Instagram className="text-pink-600" size={20} />
                </a>
                <a href="https://www.linkedin.com/company/shanfaglobal" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-700/10 rounded-full flex items-center justify-center hover:bg-blue-700/20 transition" aria-label="LinkedIn">
                  <Linkedin className="text-blue-700" size={20} />
                </a>
                <a href="https://www.tiktok.com/@shanfaglobal" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition" aria-label="TikTok">
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" className="text-black">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.6c0 2.67-1.89 4.98-4.46 5.27-2.44.28-4.72-.86-5.39-2.87-.71-2.14-.29-4.52 1.11-5.93 1.32-1.34 3.3-1.78 5.17-1.45V.02z" />
                  </svg>
                </a>
                <a href="https://www.youtube.com/@Shanfaglobal" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center hover:bg-red-600/20 transition" aria-label="YouTube">
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.346 0 12 0 12s0 3.654.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.654 24 12 24 12s0-3.654-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-black/5">
            <h2 className="font-display text-xl font-black text-black mb-6">Send us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message")
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-black text-black text-xl mb-2">Thank You!</h3>
        <p className="text-black/60">We&apos;ll respond within 24-48 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          name="name"
          required
          placeholder="Your Name"
          className="w-full h-14 px-5 bg-black/5 border border-black/10 rounded-2xl font-bold text-black placeholder:text-black/30 focus:border-black focus:outline-none transition-colors"
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          required
          placeholder="Email Address"
          className="w-full h-14 px-5 bg-black/5 border border-black/10 rounded-2xl font-bold text-black placeholder:text-black/30 focus:border-black focus:outline-none transition-colors"
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          required
          placeholder="Email Address"
          className="w-full h-14 px-5 bg-black/5 border border-black/10 rounded-2xl font-bold text-black placeholder:text-black/30 focus:border-black focus:outline-none transition-colors"
        />
      </div>
      <div>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Your Message"
          className="w-full px-5 py-4 bg-black/5 border border-black/10 rounded-2xl font-bold text-black placeholder:text-black/30 focus:border-black focus:outline-none transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Message"}
      </button>
    </form>
  );
}
