"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      
      toast.success("Message sent! We'll contact you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Your Name"
        className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Your Email"
        className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
        required
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
        rows={4}
        placeholder="Your Message"
        className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none resize-none"
        required
      />
      <button
        type="submit"
        disabled={sending}
        className="w-full h-12 bg-black text-white rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send Message
      </button>
    </form>
  );
}