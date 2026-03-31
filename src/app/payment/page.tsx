"use client";

import { useState } from 'react';
import { CreditCard, Wallet, Banknote, Shield, Lock, CheckCircle2 } from 'lucide-react';

type PaymentOption = 'card' | 'apple-pay' | 'google-pay' | 'link' | 'tabby' | 'tamara' | 'cod';

export default function PaymentPage() {
  const [selected, setSelected] = useState<PaymentOption | null>(null);
  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-1 pt-24 md:pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">
            Payment Methods
          </h1>
          <p className="text-black/60 text-lg mb-12 max-w-2xl">
            We offer multiple secure payment options to make your shopping experience convenient and safe.
          </p>

          <div className="space-y-8">
            {/* Online Payment */}
            <section className="glass-panel-heavy rounded-3xl p-8 border border-black/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black">Online Payment</h2>
                  <p className="text-black/50 text-sm">Fast & Secure</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setSelected(selected === 'card' ? null : 'card')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selected === 'card' ? 'border-black bg-black/5' : 'border-transparent bg-black/5 hover:border-black/10'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5 text-black/60" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black">Credit/Debit Card</h3>
                    <p className="text-sm text-black/50 mt-1">Visa, Mastercard, American Express</p>
                  </div>
                  {selected === 'card' && <CheckCircle2 className="w-5 h-5 text-black shrink-0" />}
                </button>
                
                <button 
                  onClick={() => setSelected(selected === 'apple-pay' ? null : 'apple-pay')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selected === 'apple-pay' ? 'border-black bg-black/5' : 'border-transparent bg-black/5 hover:border-black/10'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black">Apple Pay</h3>
                    <p className="text-sm text-black/50 mt-1">Quick checkout on Apple devices</p>
                  </div>
                  {selected === 'apple-pay' && <CheckCircle2 className="w-5 h-5 text-black shrink-0" />}
                </button>
                
                <button 
                  onClick={() => setSelected(selected === 'google-pay' ? null : 'google-pay')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selected === 'google-pay' ? 'border-black bg-black/5' : 'border-transparent bg-black/5 hover:border-black/10'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black">Google Pay</h3>
                    <p className="text-sm text-black/50 mt-1">Fast checkout on Android devices</p>
                  </div>
                  {selected === 'google-pay' && <CheckCircle2 className="w-5 h-5 text-black shrink-0" />}
                </button>
                
                <button 
                  onClick={() => setSelected(selected === 'link' ? null : 'link')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selected === 'link' ? 'border-black bg-black/5' : 'border-transparent bg-black/5 hover:border-black/10'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <LinkIcon className="w-5 h-5 text-black/60" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black">Link Pay</h3>
                    <p className="text-sm text-black/50 mt-1">Secure payment link</p>
                  </div>
                  {selected === 'link' && <CheckCircle2 className="w-5 h-5 text-black shrink-0" />}
                </button>
              </div>
            </section>

            {/* Buy Now Pay Later */}
            <section className="glass-panel-heavy rounded-3xl p-8 border border-black/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black">Buy Now, Pay Later</h2>
                  <p className="text-black/50 text-sm">Split your payments</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setSelected(selected === 'tabby' ? null : 'tabby')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${selected === 'tabby' ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50' : 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-100 hover:border-pink-300'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-black text-lg">T</span>
                    </div>
                    <h3 className="font-bold text-black text-lg">Tabby</h3>
                    {selected === 'tabby' && <CheckCircle2 className="w-5 h-5 text-pink-500 ml-auto" />}
                  </div>
                  <p className="text-sm text-black/60">Pay in 4 interest-free installments. No hidden fees.</p>
                  <ul className="mt-4 space-y-2 text-sm text-black/50">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Split into 4 payments
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      0% interest
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      No late fees
                    </li>
                  </ul>
                </button>
                
                <button 
                  onClick={() => setSelected(selected === 'tamara' ? null : 'tamara')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${selected === 'tamara' ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 hover:border-blue-300'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-white font-black text-lg">T</span>
                    </div>
                    <h3 className="font-bold text-black text-lg">Tamara</h3>
                    {selected === 'tamara' && <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />}
                  </div>
                  <p className="text-sm text-black/60">Pay later with flexible installment plans.</p>
                  <ul className="mt-4 space-y-2 text-sm text-black/50">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Pay in 3, 6, or 12 installments
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      0% interest on select plans
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Easy online management
                    </li>
                  </ul>
                </button>
              </div>
            </section>

            {/* Cash On Delivery */}
            <section className="glass-panel-heavy rounded-3xl p-8 border border-black/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Banknote className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black">Cash on Delivery</h2>
                  <p className="text-black/50 text-sm">Pay when you receive</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelected(selected === 'cod' ? null : 'cod')}
                className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${selected === 'cod' ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 hover:border-green-300'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-black text-lg">Pay Upon Delivery</h3>
                  {selected === 'cod' && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                </div>
                <p className="text-sm text-black/60 mb-4">Pay with cash or card when your order arrives. Our delivery partner will collect the payment.</p>
                <ul className="space-y-2 text-sm text-black/50">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    No online payment required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Pay with cash or card
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    AED 10 COD fee applicable
                  </li>
                </ul>
              </button>
            </section>

            {/* Security */}
            <section className="glass-panel-heavy rounded-3xl p-8 border border-black/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black">Secure Payments</h2>
                  <p className="text-black/50 text-sm">Your security is our priority</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-black/70">256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-black/70">PCI DSS Compliant</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-black/70">Secure Payment Gateways</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
