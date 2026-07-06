"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Ticket, Copy, CheckCircle, Calendar, Sparkles, ShoppingBag, Zap, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import { useUserCountry } from "@/lib/country-detection";
import { hasValidPrice } from "@/lib/product-utils";
import { fbEvent } from "@/lib/fpixel";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: string;
  value: number;
  endDate?: Date;
}

interface OfferBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  offerText: string | null;
  ctaText: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  link: string | null;
  priority: number;
  clicks: number;
}

function OfferBannerSlider({ banners }: { banners: OfferBanner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];

  const Slide = (
    <div className="relative w-full min-h-[180px] sm:min-h-[280px] md:min-h-[360px] rounded-3xl overflow-hidden">
      <Image
        src={banner.imageUrl}
        alt={banner.title || "offer banner"}
        fill
        className="object-contain"
        sizes="100vw"
        priority
      />
      {(banner.title || banner.subtitle || banner.offerText || banner.ctaText) && (
        <div
          className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16"
          style={{ color: banner.textColor || "#000" }}
        >
          {banner.offerText && (
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2 opacity-80">{banner.offerText}</span>
          )}
          {banner.title && (
            <h2 className="font-display text-2xl sm:text-4xl md:text-6xl font-bold leading-tight max-w-xl">{banner.title}</h2>
          )}
          {banner.subtitle && (
            <p className="text-sm sm:text-lg mt-2 sm:mt-4 max-w-lg font-medium opacity-80">{banner.subtitle}</p>
          )}
          {banner.ctaText && (
            <span className="inline-flex items-center gap-2 mt-6 w-fit px-6 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest">
              {banner.ctaText} <ArrowRight size={14} />
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full rounded-3xl overflow-hidden" style={{ backgroundColor: banner.backgroundColor || undefined }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {banner.link ? (
            <Link href={banner.link} aria-label={banner.title || "offer banner"} className="block">
              {Slide}
            </Link>
          ) : (
            Slide
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
            aria-label="Next banner"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/50 w-1.5"}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OffersClient({
  products,
  coupons,
  flashProducts = [],
  banners = [],
}: {
  products: any[];
  coupons: Coupon[];
  flashProducts?: any[];
  banners?: OfferBanner[];
}) {
  const [quickView, setQuickView] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { addItem, hasAddress } = useCartStore();

  function scrollSlider(dir: "left" | "right") {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 24
      : 280;
    el.scrollBy({ left: dir === "right" ? cardWidth * 2 : -cardWidth * 2, behavior: "smooth" });
  }
  const router = useRouter();
  const userCountry = useUserCountry();

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      imageUrl: product.imageUrl,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);
    
    fbEvent('AddToCart', {
      content_ids: [product.id],
      content_type: 'product',
      content_name: product.name,
      value: product.price,
      currency: 'SAR',
    });
    
    toast.success(`${product.name} added to cart`);
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Promo code copied!");
    setTimeout(() => setCopiedCode(null), 3000);
  };

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add a delivery address first", { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading("Preparing your order...");
    try {
      const countryPrice = product.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      const unitPrice = countryPrice && Number(countryPrice.price) > 0
        ? Number(countryPrice.price)
        : (product.discountPrice ?? product.price);

      let billing = null;
      let shipping = null;

      try {
        const addressRes = await fetch("/api/account/address");
        if (addressRes.ok) {
          const addressData = await addressRes.json();
          if (addressData) {
            billing = addressData;
            shipping = addressData;
          }
        }
      } catch (e) {}

      if (!billing) {
        const guestStr = localStorage.getItem('guest_address');
        if (guestStr) {
          try {
            const guestData = JSON.parse(guestStr);
            billing = guestData;
            shipping = guestData;
          } catch (e) {}
        }
      }

      if (!billing) {
        toast.error("Please provide your shipping address", { id: tid });
        router.push("/account/address");
        return;
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [{ 
            productId: product.id, 
            quantity: 1,
            unitPrice,
            price: unitPrice
          }],
          country: userCountry,
          billing,
          shipping
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        toast.success("Order initiated!", { id: tid });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        throw new Error(data.error || "Order creation failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }


  return (
    <main className="min-h-screen bg-[#fdfaf5]">
      <style>{`
        .glitch-code {
          position: relative;
          display: inline-block;
        }
        .glitch-code::before,
        .glitch-code::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .glitch-code::before {
          color: #ff2770;
          z-index: -1;
          animation: glitch-shift 2.5s infinite linear alternate-reverse;
        }
        .glitch-code::after {
          color: #00e5ff;
          z-index: -2;
          animation: glitch-shift 2.5s infinite linear alternate-reverse 0.3s;
        }
        @keyframes glitch-shift {
          0% { transform: translate(0); }
          10% { transform: translate(-1.5px, 1px); }
          20% { transform: translate(1.5px, -1px); }
          30% { transform: translate(-1px, -0.5px); }
          40% { transform: translate(1px, 0.5px); }
          50% { transform: translate(-0.5px, 1px); }
          60% { transform: translate(0); }
          100% { transform: translate(0); }
        }
        .group:hover .glitch-code::before {
          animation-duration: 0.6s;
        }
        .group:hover .glitch-code::after {
          animation-duration: 0.6s;
        }
      `}</style>
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-black flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} /> Exclusive Offers
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Premium Beauty Deals</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">Active Deals</span>
                <span className="text-sm font-black text-black">{products.length} Products</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-2">
          <OfferBannerSlider banners={banners} />
        </section>
      )}

      {/* Hero Content */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">

          {/* Coupons Section */}
          {coupons.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
                  <Ticket size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Active Promo Codes</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Apply these at checkout</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="group relative bg-white rounded-2xl border border-black/5 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-black/5"
                  >
                    <div className="bg-gradient-to-r from-gray-950 via-black to-gray-900 text-white px-6 py-5 flex items-center justify-between gap-4 relative">
                      {/* Glitch background lines */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)' }} />
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

                      <div className="flex items-center gap-4 min-w-0">
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center flex-shrink-0 border border-white/10">
                          <Ticket size={16} className="text-white/60" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Promo Code</span>
                            {coupon.endDate && (
                              <span className="flex items-center gap-1 text-[8px] font-bold text-white/30 uppercase">
                                <Calendar size={9} /> {new Date(coupon.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white/90 truncate">{coupon.description}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="relative">
                          <span className="text-base sm:text-lg font-black tracking-[0.25em] text-white glitch-code" data-text={coupon.code}>
                            {coupon.code}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${
                            copiedCode === coupon.code
                              ? "bg-green-500 text-white scale-95"
                              : "bg-white/10 text-white hover:bg-white hover:text-black active:scale-95 border border-white/10"
                          }`}
                        >
                          {copiedCode === coupon.code ? (
                            <><CheckCircle size={12} /> Copied</>
                          ) : (
                            <><Copy size={12} /> Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flash Sales Section — horizontal slider */}
          {flashProducts.length > 0 && (
            <div className="mb-20">
              {/* Header row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/30">
                    <Zap size={24} className="text-black fill-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                      Flash Sales
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Hot deals — limited time only</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Prev / Next arrows */}
                  <button
                    onClick={() => scrollSlider("left")}
                    className="w-10 h-10 rounded-full bg-black/5 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollSlider("right")}
                    className="w-10 h-10 rounded-full bg-black/5 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90"
                    aria-label="Next"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <Link
                    href="/products/flash-sales"
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-yellow-300 transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    View All <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Scroll-snap slider */}
              <div className="relative">
                <div
                  ref={sliderRef}
                  className="flex flex-row gap-6 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
                >
                  {flashProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="relative flex-none w-[220px] sm:w-[240px] lg:w-[260px]"
                      style={{ scrollSnapAlign: "start" }}
                    >
                      <ProductCard
                        product={{
                          ...product,
                          price: product.price,
                          imageUrl: product.imageUrl,
                        }}
                        onQuickView={(p) => setQuickView(p)}
                        onAddToCart={(p) => addToCart(p)}
                        onOrderNow={(p) => orderNow(p)}
                      />
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <div className="bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                          <Zap size={10} className="fill-black" /> HOT
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Featured Discount Products */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Exclusive Deals</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Limited quantity available</p>
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard
                    product={{
                      ...product,
                      price: product.price,
                      discountPrice: product.discountPrice || undefined,
                    }}
                    onQuickView={(p) => setQuickView(p)}
                    onAddToCart={(p) => addToCart(p)}
                    onOrderNow={(p) => orderNow(p)}
                  />
                  {/* Premium Badge Wrapper */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                      <Zap size={10} className="fill-amber-400 text-amber-400" />
                      Save {product.discountPercentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-black/5 p-20 text-center shadow-xl shadow-black/[0.02]">
              <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 text-black/20">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-black mb-4">No Active Offers</h2>
              <p className="text-black/40 font-bold uppercase text-xs tracking-widest max-w-sm mx-auto mb-10">
                We're currently preparing new exclusive deals for you. Check back very soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-black/20"
              >
                Explore Collection <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Premium Trust Section */}
      <section className="bg-black text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: "Authentic Only", desc: "Every product is sourced directly from certified brand partners." },
              { icon: Truck, title: "Swift Delivery", desc: "Priority shipping across the region with live order tracking." },
              { icon: Heart, title: "Skin First", desc: "Expertly curated selections tailored to your unique skin concerns." }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                  <item.icon size={32} className="text-white/80" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest mb-3">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => { setQuickView(null); router.push(`/products/${productId}`); }}
      />
    </main>
  );
}

// Helper icons that were missing
function ShieldCheck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  )
}

function Truck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
  )
}

function Heart(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  )
}
