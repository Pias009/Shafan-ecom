import { ArrowLeft, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";
import Link from "next/link";
import ContactForm from "./ContactForm";

const WHATSAPP = "+971547206046";
const PHONE = "+971 04 838 7827";
const EMAIL = "support@shanfaglobal.com";
const ADDRESS = "AL Diyafa Shopping Center, AL Baada, Dubai, United Arab Emirates";

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
              <p className="text-black/60 text-lg mb-6">
                Have a question? We'd love to hear from you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-green-600" />
                <a 
                  href={`https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=Hi%20Shafan%20Global,%20I%20have%20a%20question.`} 
                  target="_blank" 
                  className="font-bold text-black hover:text-green-600 transition"
                >
                  {WHATSAPP}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-black/40" />
                <a href={`tel:${PHONE}`} className="font-bold text-black hover:text-black/70 transition">
                  {PHONE}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-black/40" />
                <a href={`mailto:${EMAIL}`} className="font-bold text-black hover:text-black/70 transition">
                  {EMAIL}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-black/40 mt-0.5" />
                <span className="font-bold text-black">{ADDRESS}</span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs font-black uppercase tracking-widest text-black/30 mb-4">Follow Us</p>
              <div className="flex gap-4">
                <a href={`https://wa.me/${WHATSAPP.replace(/\D/g, '')}`} target="_blank" className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center hover:bg-green-500/20 transition">
                  <MessageCircle className="text-green-600" size={18} />
                </a>
                <a href="https://www.facebook.com/ShanfaGlobalArabia" target="_blank" className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center hover:bg-blue-500/20 transition">
                  <Facebook className="text-blue-600" size={18} />
                </a>
                <a href="https://www.instagram.com/shanfa.global" target="_blank" className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center hover:bg-pink-500/20 transition">
                  <Instagram className="text-pink-600" size={18} />
                </a>
                <a href="https://www.linkedin.com/company/shanfaglobal" target="_blank" className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center hover:bg-blue-600/20 transition">
                  <Linkedin className="text-blue-700" size={18} />
                </a>
                <a href="https://www.tiktok.com/@shanfaglobal" target="_blank" className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition">
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" className="text-black">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.6c0 2.67-1.89 4.98-4.46 5.27-2.44.28-4.72-.86-5.39-2.87-.71-2.14-.29-4.52 1.11-5.93 1.32-1.34 3.3-1.78 5.17-1.45V.02z"/>
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
