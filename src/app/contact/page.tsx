"use client";

import { ArrowLeft, Phone, Mail, MapPin, Clock, MessageSquare, ExternalLink, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const OFFICES = [
  {
    title: "Dubai Office",
    address: "405, Al Diyafa Center, Satwa Roundabout, Dubai, United Arab Emirates",
    phone: "+971 04 834 7827",
    tel: "+971048347827",
    email: "support@shanfaglobal.com",
    mapUrl: "https://maps.google.com/?q=Al+Diyafa+Shopping+Center+Satwa+Dubai",
    embedMap: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.847113039648!2d55.275529!3d25.242056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f42c262e3d33f%3A0xbd88f7b7cb3b65cb!2sAl%20Diyafa%20Shopping%20Centre!5e0!3m2!1sen!2sae!4v1700000000000",
  },
  {
    title: "Kuwait Office",
    address: "Abdullah Al Mubarak St., Star Tower 6th Floor, Kuwait City, Kuwait",
    phone: "+965 50564595",
    tel: "+96550564595",
    email: "info@shanfagroup.com",
    mapUrl: "https://maps.google.com/?q=Star+Tower+Kuwait+City",
    embedMap: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3477.536965156734!2d47.977408!3d29.378586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fcf848e028b21c3%3A0x3be652033dbcfbd!2sStar%20Tower!5e0!3m2!1sen!2skw!4v1700000000000",
  },
  {
    title: "Spain Office",
    address: "Av. de Mistral 25, 08015 Barcelona, Spain",
    phone: "+34 612 44 08 18",
    tel: "+34612440818",
    email: "support@shanfaglobal.com",
    mapUrl: "https://maps.google.com/?q=Av.+de+Mistral+25+08015+Barcelona+Spain",
    embedMap: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2993.842795897034!2d2.155799!3d41.377519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4a27bc19a4bc9%3A0xc3ce1e5a5f57ff76!2sAv.%20de%20Mistral%2C%2025%2C%20Eixample%2C%2008015%20Barcelona%2C%20Spain!5e0!3m2!1sen!2ses!4v1700000000000",
  },
];

export default function ContactPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      {/* Top Banner Header */}
      <div className="bg-neutral-900 text-white py-14 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-6 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Contact Us For Any Questions</h1>
          <p className="text-neutral-400 mt-2 text-sm md:text-base">
            Reach out to our international offices or get direct assistance from our global customer team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-6">
        {/* 3 Global Offices Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {OFFICES.map((office) => (
            <div
              key={office.title}
              className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Map embed preview */}
              <div className="h-44 w-full bg-neutral-100 relative">
                <iframe
                  title={`${office.title} Map`}
                  src={office.embedMap}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  className="w-full h-full grayscale-[25%] contrast-125"
                />
              </div>

              {/* Office Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">{office.title}</h3>
                  <div className="space-y-2.5 text-sm text-neutral-600">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={16} className="text-neutral-400 shrink-0 mt-0.5" />
                      <span>{office.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-neutral-400 shrink-0" />
                      <a href={`tel:${office.tel}`} className="font-semibold text-neutral-900 hover:text-neutral-600">
                        {office.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail size={16} className="text-neutral-400 shrink-0" />
                      <a href={`mailto:${office.email}`} className="text-neutral-700 hover:underline">
                        {office.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-neutral-100">
                  <a
                    href={office.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600"
                  >
                    Open in Maps <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-neutral-900">Do you have some questions?</h2>
          <p className="text-neutral-500 mt-2 text-sm md:text-base">We are at your disposal 7 days a week!</p>
        </div>

        {/* 3 Channels (Call Us, Send Message, Visit in our Store) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Call us */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 text-center flex flex-col items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <Phone size={24} />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Call us</h3>
              <p className="text-xl font-bold text-neutral-900">+971 04 834 7827</p>
              <div className="text-xs text-neutral-500 space-y-0.5 pt-1">
                <p>Monday – Friday: 9:00 – 20:00</p>
                <p>Saturday: 11:00 – 16:00</p>
              </div>
            </div>
            <a
              href="https://wa.me/971547206046?text=Hello%20Shanfa%20Customer%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Live Chat
            </a>
          </div>

          {/* Send message */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 text-center flex flex-col items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <Mail size={24} />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Send message</h3>
              <p className="text-sm font-semibold text-neutral-900">support@shanfaglobal.com</p>
              <div className="text-xs text-neutral-500 space-y-1 pt-1">
                <p><span className="font-semibold text-neutral-700">Orders:</span> support@shanfaglobal.com</p>
                <p><span className="font-semibold text-neutral-700">Returns:</span> support@shanfaglobal.com</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFormOpen(true);
                document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 px-4 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Contact form
            </button>
          </div>

          {/* Visit our store */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 text-center flex flex-col items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <MapPin size={24} />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Visit in our store</h3>
              <p className="text-sm font-semibold text-neutral-900">
                Al Diyafa Center, Satwa Roundabout
              </p>
              <p className="text-xs text-neutral-500">Dubai, United Arab Emirates</p>
            </div>
            <a
              href="https://maps.google.com/?q=Al+Diyafa+Shopping+Center+Satwa+Dubai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Show on map
            </a>
          </div>
        </div>

        {/* Contact Form Section */}
        <div id="contact-form-section" className="bg-white rounded-3xl p-8 md:p-12 border border-neutral-200/80 shadow-sm max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-neutral-900">Send Us an Inquiry</h3>
            <p className="text-neutral-500 text-sm mt-1">
              Have questions regarding orders, partnerships, or product inquiries? Fill out the form below.
            </p>
          </div>
          <ContactForm />
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
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      <div className="text-center py-10">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-6 h-6 text-emerald-600" />
        </div>
        <h4 className="font-bold text-neutral-900 text-lg mb-1">Message Sent Successfully!</h4>
        <p className="text-neutral-500 text-sm">Thank you for reaching out. We will get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="John Doe"
            className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="john@example.com"
            className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          placeholder="Order Inquiry / Product Question"
          className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
          Your Message *
        </label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="How can we assist you today?"
          className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-neutral-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Inquiry"}
      </button>
    </form>
  );
}
