import { Metadata } from "next";
import { ArrowRight, Clock, Shield, Truck, CheckCircle, XCircle, CreditCard, Mail, Phone, AlertTriangle, Package, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return & Refund Policy | SHANFA",
  description: "SHANFA Return & Refund Policy - Learn about return eligibility, refund process, and cancellation terms.",
};

export default function ReturnsPolicyPage() {
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
    </div>
  );
}
