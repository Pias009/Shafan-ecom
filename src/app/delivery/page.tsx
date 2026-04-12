import { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Truck, MapPin, Clock, CheckCircle, AlertCircle, ExternalLink, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delivery Information | Shafan',
  description: 'Fast and reliable delivery across GCC countries. Free delivery on orders above minimum value.',
};

const courierPartners = [
  {
    name: 'Aramex',
    website: 'https://www.aramex.com',
    trackingUrl: 'https://www.aramex.com/na/en/track',
    description: 'Global logistics leader with express delivery to 190+ countries',
    coverage: 'UAE, GCC, Global',
    features: ['Real-time tracking', '600+ drop-off locations', 'Express delivery 2-5 days', 'Professional handling'],
    logo: '📦',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Naqel Express',
    website: 'https://www.naqelexpress.com',
    trackingUrl: 'https://www.naqelexpress.com/en/Track',
    description: 'Leading Saudi logistics provider with strong GCC presence',
    coverage: 'Saudi Arabia, Kuwait, GCC',
    features: ['Express delivery 2-4 days', 'Cash on Delivery (COD)', 'International road freight', 'Competitive domestic rates'],
    logo: '🚚',
    color: 'from-green-500 to-green-600',
  },
];

const deliveryData = [
  {
    country: 'United Arab Emirates',
    code: 'AE',
    currency: 'AED',
    flag: '🇦🇪',
    minOrder: 80,
    deliveryFee: 15,
    freeDelivery: 150,
  },
  {
    country: 'Saudi Arabia',
    code: 'SA',
    currency: 'SAR',
    flag: '🇸🇦',
    minOrder: 159,
    deliveryFee: 19,
    freeDelivery: 359,
  },
  {
    country: 'Qatar',
    code: 'QA',
    currency: 'QAR',
    flag: '🇶🇦',
    minOrder: 129,
    deliveryFee: 19,
    freeDelivery: 299,
  },
  {
    country: 'Kuwait',
    code: 'KW',
    currency: 'KWD',
    flag: '🇰🇼',
    minOrder: 12,
    deliveryFee: 1.5,
    freeDelivery: 18,
  },
  {
    country: 'Bahrain',
    code: 'BH',
    currency: 'BHD',
    flag: '🇧🇭',
    minOrder: 13,
    deliveryFee: 1.99,
    freeDelivery: 18,
  },
  {
    country: 'Oman',
    code: 'OM',
    currency: 'OMR',
    flag: '🇴🇲',
    minOrder: 16,
    deliveryFee: 1.9,
    freeDelivery: 22,
  },
];

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white/40 backdrop-blur-sm">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">
            Delivery Information
          </h1>
          <p className="text-black/60 text-lg mb-12 max-w-2xl">
            We deliver to GCC countries with competitive rates and free delivery on orders above minimum value.
          </p>

          {/* Delivery Partners */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-black mb-6">Our Delivery Partners</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Dubai Warehouse</h3>
                    <p className="text-sm text-black/50">Naqel Express & Aramex</p>
                  </div>
                </div>
              </div>
              <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Kuwait</h3>
                    <p className="text-sm text-black/50">Shanfa Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Country Delivery Fees */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-black mb-6">Delivery by Country</h2>
            <div className="space-y-4">
              {deliveryData.map((item) => (
                <div key={item.code} className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{item.flag}</span>
                      <div>
                        <h3 className="font-bold text-black text-lg">{item.country}</h3>
                        <p className="text-sm text-black/50">Shipping to {item.country}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:gap-8">
                      <div className="text-center">
                        <div className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Min. Order</div>
                        <div className="font-black text-black">{item.currency} {item.minOrder}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Delivery Fee</div>
                        <div className="font-black text-black">{item.currency} {item.deliveryFee}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Free Delivery</div>
                        <div className="font-black text-green-600">Above {item.currency} {item.freeDelivery}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Info */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-black">Delivery Time</h3>
              </div>
              <ul className="space-y-3 text-sm text-black/60">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>UAE: 2-4 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>GCC Countries: 3-7 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Orders placed before 2 PM are processed same day</span>
                </li>
              </ul>
            </div>

            <div className="glass-panel-heavy rounded-2xl p-6 border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-black">Tracking</h3>
              </div>
              <ul className="space-y-3 text-sm text-black/60">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Track your order in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>SMS and email updates at every stage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Contactless delivery available</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Important Note */}
          <section className="mt-8">
            <div className="glass-panel-heavy rounded-2xl p-6 border border-amber-200 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-black mb-2">Important Notes</h3>
                  <ul className="space-y-2 text-sm text-black/60">
                    <li>• Orders below minimum order value cannot be processed</li>
                    <li>• Delivery fees are calculated based on shipping address</li>
                    <li>• Free delivery automatically applies when order exceeds free delivery threshold</li>
                    <li>• Remote areas may have extended delivery times</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      
    </div>
  );
}
