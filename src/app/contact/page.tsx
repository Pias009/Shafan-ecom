import { ArrowLeft, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import ContactForm from "./ContactForm";

export const dynamic = 'force-dynamic';

async function getContactInfo() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/contact`, { 
      cache: 'no-store' 
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return { 
    phone: "+971 04 838 7827", 
    whatsapp: "971501234567",
    email: "support@shanfaglobal.com", 
    address: "Office 405, Al Diyafa Center, Satwa Roundabout, Dubai, UAE" 
  };
}

export default async function ContactPage() {
  const contact = await getContactInfo();

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
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
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-black text-black mb-4">Get in Touch</h2>
              <p className="text-black/60 text-lg">
                Have a question? We'd love to hear from you.
              </p>
            </div>

            <div className="space-y-4">
              {contact.whatsapp && (
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-green-600" />
                  <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=Hi%20Shafa%20Global,%20I%20have%20a%20question%20about%20my%20order.`} target="_blank" className="font-bold text-black hover:text-green-600 transition">
                    {contact.whatsapp}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-black/40" />
                  <a href={`tel:${contact.phone}`} className="font-bold text-black hover:text-black/70 transition">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-black/40" />
                  <a href={`mailto:${contact.email}`} className="font-bold text-black hover:text-black/70 transition">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-black/40" />
                  <span className="font-bold text-black">{contact.address}</span>
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="pt-4">
              <p className="text-xs font-black uppercase tracking-widest text-black/30 mb-4">Follow Us</p>
              <div className="flex gap-4">
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=Hi%20Shafa%20Global,%20I%20have%20a%20question%20about%20my%20order.`} target="_blank" className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center hover:bg-green-500/20 transition">
                  <MessageCircle className="text-green-600" size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center hover:bg-blue-500/20 transition">
                  <Facebook className="text-blue-600" size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center hover:bg-pink-500/20 transition">
                  <Instagram className="text-pink-600" size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-black/5">
            <h2 className="font-display text-xl font-black text-black mb-6">Send us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}