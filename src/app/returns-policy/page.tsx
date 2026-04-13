<<<<<<< HEAD
import { Metadata } from "next";
import { ArrowRight, Clock, Shield, Truck, CheckCircle, XCircle, CreditCard, Mail, Phone, AlertTriangle, Package, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Shafan",
  description: "Shafan Return & Refund Policy - Learn about return eligibility, refund process, and cancellation terms.",
=======
import { Metadata } from 'next';
import { RotateCcw, CheckCircle, XCircle, Mail, Clock, Truck, Shield, RefreshCw, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Cancellation Policy | Shafa Global',
  description: 'Returns & Cancellation Policy for Shafa Global Orders (UAE & GCC)',
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
};

export default function ReturnsPolicyPage() {
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
          <h1 className="font-display text-4xl md:text-5xl font-black">Return & Refund Policy</h1>
          <p className="text-white/60 mt-2">Shanha Global - Orders (UAE & GCC)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <p className="text-black/60 text-lg mb-8">
          This Return & Refund Policy forms part of the Terms and Conditions of Shanha Global. By placing an order on our website or through any official sales channel, the customer agrees to the terms stated below.
        </p>

        {/* Section 1: Return Eligibility */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
            <h2 className="text-xl font-black text-black">Return Eligibility</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-black/60 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-black">1.1 Returns must be requested within 2 (two) calendar days from the date of delivery.</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-black mb-2">1.2 Returns are strictly accepted only for:</p>
              <ul className="space-y-2 ml-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-black/70">Items received in defective condition, or</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-black/70">Items that are damaged upon delivery</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-black mb-2">1.3 No returns shall be accepted for:</p>
              <ul className="space-y-2 ml-2">
                <li className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-black/70">Change of mind</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-black/70">Opened or used products</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-black/70">Items not in original condition or packaging</span>
                </li>
              </ul>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-black/70">1.4 All return requests are subject to approval by Shanha Global Customer Support.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Condition of Returned Items */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
            <h2 className="text-xl font-black text-black">Condition of Returned Items</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <p className="font-bold text-black mb-3">2.1 Returned products must be:</p>
            <ul className="space-y-2 text-black/70 mb-4">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>Unused and unopened</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>In original packaging with all seals intact (if applicable)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>Accompanied by valid proof of purchase (invoice/order confirmation)</span>
              </li>
            </ul>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-black/70">2.2 Shanha Global reserves the right to reject any return that does not meet these conditions.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Return Process */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
            <h2 className="text-xl font-black text-black">Return Process</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
            <p className="font-bold text-black">3.1 Customers must contact Customer Support to initiate a return request:</p>
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-black/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-black/60" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-black/40">Email</p>
                  <a href="mailto:support@shanfaglobal.com" className="font-bold text-black hover:underline">support@shanfaglobal.com</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-black/60" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-black/40">Phone</p>
                  <a href="tel:+971048347827" className="font-bold text-black hover:underline">+971 04 834 7827</a>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-black/60">
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                <span>3.2 Upon approval, the customer will receive return instructions and authorization.</span>
              </li>
              <li className="flex items-start gap-2">
                <Package className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                <span>3.3 Returned items must be shipped or handed over as instructed by our support team.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                <span>3.4 Shanha Global reserves the right to inspect all returned items before processing refunds or exchanges.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Exchanges */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">4</span>
            <h2 className="text-xl font-black text-black">Exchanges</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-2 text-black/60">
            <p>4.1 Exchanges are available only for eligible defective or damaged items, subject to stock availability.</p>
            <p>4.2 If replacement is not available, a refund will be issued in accordance with this policy.</p>
          </div>
        </section>

        {/* Section 5: Refund Policy */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">5</span>
            <h2 className="text-xl font-black text-black">Refund Policy</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-3 text-black/60">
            <div className="flex items-start gap-2">
              <CreditCard className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
              <p>5.1 Approved refunds will be issued to the original payment method only.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p>5.2 Refunds are processed after inspection and approval of returned items.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p>5.3 Refund approval does not imply immediate credit; banking timelines may apply.</p>
            </div>
          </div>
        </section>

        {/* Section 6: Refund Processing Time */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">6</span>
            <h2 className="text-xl font-black text-black">Refund Processing Time</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
              <p className="font-bold text-black mb-3">6.1 Online Payments (Card / Digital Payment):</p>
              <ul className="space-y-2 text-black/60">
                <li className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                  <span>Refunds are processed within 5 working days after approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                  <span>Additional 5-7 working days may be required for bank processing</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
              <p className="font-bold text-black mb-3">6.2 Cash on Delivery (COD):</p>
              <ul className="space-y-2 text-black/60">
                <li className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
                  <span>Refunds will be processed within 14-21 working days after approval</span>
                </li>
              </ul>
            </div>
            <div className="p-3 bg-black/5 rounded-xl">
              <p className="text-sm text-black/60">6.3 Processing times may vary depending on the customers bank or payment provider.</p>
            </div>
          </div>
        </section>

        {/* Section 7: Non-Returnable Items */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">7</span>
            <h2 className="text-xl font-black text-black">Non-Returnable & Non-Refundable Items</h2>
          </div>
          <div className="bg-red-50 rounded-3xl p-6 border border-red-200">
            <p className="font-bold text-black mb-4">The following items are strictly non-returnable and non-refundable:</p>
            <ul className="space-y-2 text-black/70">
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>Gift cards or vouchers</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>Clearance / promotional / final sale items</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>Items marked as &quot;non-returnable&quot; at the time of purchase</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 8-10 */}
        <section className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="w-6 h-6 text-black" />
              <h3 className="font-bold text-black text-lg">8. Shipping Costs</h3>
            </div>
            <p className="text-black/60">8.1 Return shipping may be covered by Shanha Global only in cases of verified defective or damaged items.</p>
            <p className="text-black/60 mt-2">8.2 In all other cases, return shipping responsibility lies with the customer (if applicable based on approval terms).</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-black" />
              <h3 className="font-bold text-black text-lg">9. Risk & Ownership</h3>
            </div>
            <p className="text-black/60">9.1 Risk of returned goods remains with the customer until received and confirmed by Shanha Global.</p>
            <p className="text-black/60 mt-2">9.2 Shanha Global is not responsible for lost or damaged return shipments sent without authorization.</p>
          </div>

          <div className="bg-black/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-black" />
              <h3 className="font-bold text-black text-lg">10. Amendments</h3>
            </div>
            <p className="text-black/60">Shanha Global reserves the right to modify or update this Return & Refund Policy at any time without prior notice. Updated versions will be posted on the official website.</p>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="mt-12 p-6 bg-black text-white rounded-2xl">
          <h3 className="font-bold text-lg mb-2">Questions?</h3>
          <p className="text-white/70 text-sm mb-4">Contact us for return requests or any questions.</p>
          <Link href="/contact" className="text-sm font-bold underline">Contact Us</Link>
        </div>
      </div>
=======
    <div className="min-h-screen flex flex-col bg-white/40 backdrop-blur-sm">
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
              Returns & Cancellation Policy
            </h1>
          </div>
          <p className="text-black/60 text-lg mb-4 max-w-2xl">
            <strong>Shafa Global – Orders (UAE & GCC)</strong>
          </p>
          <p className="text-black/50 text-sm mb-12 max-w-2xl">
            We aim to ensure customer satisfaction with every purchase. By placing an order on our website, you agree to the terms below.
          </p>

          <div className="space-y-8">
            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                1. Return Eligibility
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span><strong>1.1</strong> Returns must be requested within <strong>2 days</strong> of delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span><strong>1.2</strong> Only <strong>defective or damaged items</strong> are eligible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span><strong>1.3</strong> Products must be <strong>unused</strong> and in <strong>original packaging</strong>.</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                2. Non-Returnable Items
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Clearance / sale items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Gift cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Opened or used products</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                3. Return Process
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span>Email: <a href="mailto:support@shanfaglobal.com" className="text-blue-600 hover:underline">support@shanfaglobal.com</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span>Provide order details and proof of issue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span>Await return approval from our team</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-black/50 italic">
                Approved items must be returned as instructed.
              </p>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                4. Refund Policy
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span><strong>4.1</strong> Refunds are issued to the <strong>original payment method only</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span><strong>4.2</strong> All returned items are <strong>inspected</strong> before approval.</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                5. Refund Processing Time
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-black">Online Payments</h3>
                      <p className="text-sm text-black/60">Credit/Debit Card, Apple Pay, etc.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-black">5 working days + 5-7 days bank processing</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">💵</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-black">COD Orders</h3>
                      <p className="text-sm text-black/60">Cash on Delivery</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-black">14-21 working days</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                6. Order Cancellation
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span><strong>6.1</strong> Orders cannot be cancelled once confirmed or shipped.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span><strong>6.2</strong> Shafa Global may cancel orders due to:</span>
                </li>
                <li className="ml-6 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Stock issues</span>
                </li>
                <li className="ml-6 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Pricing errors</span>
                </li>
                <li className="ml-6 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>Suspicious transactions</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-500" />
                7. Shipping for Returns
              </h2>
              <ul className="space-y-3 text-black/60">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                  <span>Free return shipping for <strong>approved defective items only</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                  <span>Otherwise, customers may be responsible for return shipping.</span>
                </li>
              </ul>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-amber-200 bg-amber-50/50">
              <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Amendments
              </h2>
              <p className="text-black/60">
                This policy may be updated at any time without prior notice.
              </p>
            </section>

            <section className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-black mb-2">Need Help?</h3>
                  <p className="text-sm text-black/60">
                    For return-related inquiries, contact us at <a href="mailto:support@shanfaglobal.com" className="text-rose-600 hover:underline">support@shanfaglobal.com</a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
>>>>>>> 598ede5fb3175f90e4a2fb288ad69f1cde56222d
    </div>
  );
}
