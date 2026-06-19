'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const SesiChat      = dynamic(() => import('@/components/Sesi/SesiChat'),                          { ssr: false });
const LoadingScreen = dynamic(() => import('./LoadingScreen'),                                      { ssr: false });

const BG1 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85';
const BG2 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85';
const TOTAL = 240;
const FRAME = (n: number) => `/video/frames/frame_${String(n).padStart(4, '0')}.jpg`;

const CSS = `
  @keyframes fp        { 0%,100%{opacity:.2} 50%{opacity:1} }
  @keyframes marquee-left  { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
  @keyframes marquee-right { 0%{transform:translateX(-25%)} 100%{transform:translateX(0)} }
  @keyframes hzoom     { from{transform:scale(1.08)} to{transform:scale(1)} }
  .hero-bg             { animation: hzoom 2.4s ease forwards; }
  .hero-content        { animation: hfade 1.2s ease 0.2s both; }
  @keyframes hfade     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes wrd-in    { from{opacity:0;transform:translateY(14px) scale(0.92)} to{opacity:1;transform:none} }
  @keyframes line-grow { from{width:0} to{width:100%} }
  @keyframes page-reveal { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:none} }
  @keyframes loader-out { from{opacity:1;transform:none} to{opacity:0;transform:scale(1.06)} }
  @keyframes border-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes pulse-dot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  @keyframes scan-line   { 0%{top:-2px} 100%{top:100%} }
  @keyframes chat-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes input-glow  { 0%,100%{box-shadow:0 0 0 0 rgba(192,132,252,0)} 50%{box-shadow:0 0 22px 3px rgba(192,132,252,0.08)} }

  /* ── dark shell: attribute selectors — works with Tailwind JIT ── */

  /* ── avatar next to every AI bubble ── */
  /* AI bubbles sit inside justify-start flex rows — we target the wrapper */
  .sesi-dark-shell .flex.justify-start {
    padding-left: 40px;
    position: relative;
  }
  .sesi-dark-shell .flex.justify-start::before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 4px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cellipse cx='20' cy='14' rx='10' ry='11' fill='%237c3aed'/%3E%3Cellipse cx='20' cy='15.5' rx='8.5' ry='9' fill='%23fddcb5'/%3E%3Cellipse cx='13.5' cy='18' rx='2.5' ry='1.4' fill='rgba(255,160,160,0.45)'/%3E%3Cellipse cx='26.5' cy='18' rx='2.5' ry='1.4' fill='rgba(255,160,160,0.45)'/%3E%3Cellipse cx='16.5' cy='15' rx='1.6' ry='1.8' fill='%232d1b69'/%3E%3Cellipse cx='17.1' cy='14.3' rx='0.5' ry='0.5' fill='white'/%3E%3Cellipse cx='23.5' cy='15' rx='1.6' ry='1.8' fill='%232d1b69'/%3E%3Cellipse cx='24.1' cy='14.3' rx='0.5' ry='0.5' fill='white'/%3E%3Cpath d='M15.5 21 Q20 25 24.5 21' stroke='%23e07060' stroke-width='1.4' stroke-linecap='round' fill='none'/%3E%3Cpath d='M17 21.5 Q20 23.5 23 21.5' fill='white' opacity='0.9'/%3E%3Cpath d='M11 13 Q13 7 20 7 Q27 7 29 13 Q26 10 20 10.5 Q14 10 11 13Z' fill='%236d28d9'/%3E%3Crect x='17' y='23.5' width='6' height='3' rx='1.5' fill='%23fddcb5'/%3E%3Cpath d='M8 40 Q10 28 17 26 L20 28 L23 26 Q30 28 32 40Z' fill='white'/%3E%3Cpath d='M14 40 Q15 30 20 29 Q25 30 26 40Z' fill='%23c084fc' opacity='0.6'/%3E%3C/svg%3E")
      center/cover,
      linear-gradient(160deg,%231e0f3a,%232d1255);
    border: 1px solid rgba(232,121,249,0.3);
    box-shadow: 0 0 8px rgba(168,85,247,0.3);
    flex-shrink: 0;
  }
  /* hide avatar on user messages */
  .sesi-dark-shell .flex.justify-end::before { display: none; }

  /* nuke ALL white backgrounds */
  .sesi-dark-shell [class*="bg-white"] {
    background-color: rgba(28,18,50,0.96) !important;
    border-color: rgba(200,150,255,0.1) !important;
  }
  .sesi-dark-shell [class*="bg-teal-50"] {
    background-color: rgba(14,28,40,0.96) !important;
    border-color: rgba(45,200,200,0.12) !important;
  }

  /* ALL text inside dark shell — bright readable */
  .sesi-dark-shell p,
  .sesi-dark-shell span,
  .sesi-dark-shell label { color: #ede6ff !important; }

  /* dimmer secondary text */
  .sesi-dark-shell [class*="text-gray-4"],
  .sesi-dark-shell [class*="text-teal-4"] { color: rgba(200,175,240,0.5) !important; }

  .sesi-dark-shell [class*="text-amber-8"] { color: #fcd34d !important; }
  .sesi-dark-shell [class*="text-teal-7"]  { color: #5eead4 !important; }

  /* user bubble — pink-purple gradient, white text */
  .sesi-dark-shell [class*="bg-pink-5"] {
    background: linear-gradient(135deg,#db2777,#9333ea) !important;
  }
  .sesi-dark-shell [class*="bg-pink-5"] p,
  .sesi-dark-shell [class*="bg-pink-5"] span { color: #fff !important; }

  .sesi-dark-shell [class*="bg-teal-5"] { background-color: #0f766e !important; }
  .sesi-dark-shell [class*="bg-teal-5"] p,
  .sesi-dark-shell [class*="bg-teal-5"] span { color: #fff !important; }

  /* INPUT — pink tinted */
  .sesi-dark-shell input {
    background-color: rgba(219,39,119,0.16) !important;
    border-color: rgba(236,72,153,0.45) !important;
    color: #fff !important;
    caret-color: #f9a8d4 !important;
  }
  .sesi-dark-shell input::placeholder { color: rgba(249,168,212,0.45) !important; }
  .sesi-dark-shell input:focus {
    outline: none !important;
    border-color: rgba(236,72,153,0.75) !important;
    box-shadow: 0 0 0 3px rgba(236,72,153,0.2) !important;
  }

  /* send button */
  .sesi-dark-shell button[class*="bg-pink"] {
    background: linear-gradient(135deg,#db2777,#9333ea) !important;
    color: #fff !important;
  }
  .sesi-dark-shell button[class*="bg-teal"] {
    background-color: #0d9488 !important;
    color: #fff !important;
  }

  /* dividers */
  .sesi-dark-shell [class*="border-t"]  { border-top-color:    rgba(236,72,153,0.15) !important; }
  .sesi-dark-shell [class*="border-b"]  { border-bottom-color: rgba(200,150,255,0.1) !important; }
  .sesi-dark-shell [class*="border-gray"] { border-color: rgba(200,150,255,0.1) !important; }
  .sesi-dark-shell [class*="divide-"] > * + * { border-color: rgba(200,150,255,0.08) !important; }

  /* scrollbar */
  .sesi-dark-shell [class*="overflow-y"] {
    scrollbar-width: thin;
    scrollbar-color: rgba(236,72,153,0.25) transparent;
  }
  @keyframes grain {
    0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-2%)}
    30%{transform:translate(2%,-1%)} 50%{transform:translate(-1%,2%)}
    70%{transform:translate(3%,1%)} 90%{transform:translate(-2%,3%)}
  }
  .grain::after {
    content:''; position:fixed; inset:-50%; width:200%; height:200%;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
    animation: grain 0.8s steps(1) infinite;
    pointer-events:none; z-index:2; opacity:0.35;
  }
`;

export default function DoctorSasiLanding() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (loaded) {
      window.scrollTo(0, 0);
      document.body.style.overflow = '';
    }
  }, [loaded]);

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', background: '#000' }}>
      <style suppressHydrationWarning>{CSS}</style>

      {/* Only mount LoadingScreen client-side to avoid hydration mismatch */}
      <LoadingScreen onDone={() => setLoaded(true)} />

      {/* Page content — fades in after loader exits */}
      <div style={{
        animation: loaded ? 'page-reveal 1s ease forwards' : 'none',
        opacity: loaded ? 1 : 0,
      }}>
        <HeroSection />
        <VideoSection />
        <ChatSection />
      </div>
    </div>
  );
}


/* ─── SECTION 1: Hero with cursor spotlight ─── */
function HeroSection() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bg2Ref    = useRef<HTMLImageElement | null>(null);
  const mouse     = useRef({ x: 0, y: 0 });
  const smooth    = useRef({ x: 0, y: 0 });
  const hover     = useRef(false);
  const raf       = useRef<number | null>(null);
  const [opacity, setOpacity] = useState(1);

  // reverse-scroll fade
  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const scrolled = window.scrollY;
      const h = wrap.offsetHeight;
      const val = Math.max(0, Math.min(1, 1 - scrolled / (h * 0.65)));
      setOpacity(val);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // preload BG2 for spotlight reveal
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = BG2;
    img.onload = () => { bg2Ref.current = img; };
  }, []);

  // mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // rAF canvas spotlight — draw BG image masked to cursor circle
  useEffect(() => {
    const tick = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;

      const c   = canvasRef.current;
      const w   = wrapRef.current;
      const img = bg2Ref.current;
      if (!c || !w) { raf.current = requestAnimationFrame(tick); return; }

      const dpr  = window.devicePixelRatio || 1;
      const rect = w.getBoundingClientRect();
      const cw   = Math.round(rect.width);
      const ch   = Math.round(rect.height);

      if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr)) {
        c.width  = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
      }

      const ctx = c.getContext('2d')!;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      if (hover.current && img?.complete && img.naturalWidth > 0) {
        const mx = smooth.current.x - rect.left;
        const my = smooth.current.y - rect.top;
        const R  = 300;

        // 1. draw the full BG image cover-fit onto canvas
        const sc = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth  * sc;
        const dh = img.naturalHeight * sc;
        const ox = (dw - cw) / 2;
        const oy = (dh - ch) / 2;
        ctx.drawImage(img, -ox, -oy, dw, dh);

        // 2. use destination-in with radial gradient to keep only the spotlight circle
        ctx.globalCompositeOperation = 'destination-in';
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, R);
        g.addColorStop(0,   'rgba(0,0,0,1)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.8)');
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => { hover.current = true; }}
      onMouseLeave={() => { hover.current = false; }}
      style={{ height: '100svh', position: 'relative', overflow: 'hidden', opacity, transition: 'opacity 0.08s linear' }}
    >
      <style>{`
        @media (max-width: 640px) {
          .hero-side-text { display: none !important; }
          .hero-centre-sub { font-size: 0.82rem !important; max-width: 88vw !important; }
          .hero-eyebrow { font-size: 0.5rem !important; letter-spacing: 0.22em !important; }
          .hero-title-main { font-size: clamp(3rem,14vw,5rem) !important; }
          .hero-title-sub  { font-size: clamp(1.8rem,8vw,3rem) !important; }
          .hero-bottom-truth { bottom: 70px !important; left: 20px !important; }
          .hero-top-label { top: 20px !important; left: 20px !important; }
        }
      `}</style>

      {/* BG — cover + center on all screen sizes */}
      <div className="hero-bg" style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('${BG1}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        width: '100%', height: '100%',
      }} />

      {/* gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom,rgba(0,0,0,0.12) 0%,transparent 40%,rgba(0,0,0,0.6) 100%)',
        zIndex: 1,
      }} />

      {/* spotlight canvas */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* TOP LEFT — label */}
      <div className="hero-top-label" style={{
        position: 'absolute', top: 20, left: 20, zIndex: 3,
        pointerEvents: 'none', animation: 'hfade 1.6s ease 0.3s both',
      }}>
        <p style={{
          margin: 0, color: 'rgba(255,255,255,0.7)',
          fontSize: '0.6rem', letterSpacing: '0.36em', textTransform: 'uppercase',
          textShadow: '0 1px 12px rgba(0,0,0,0.8)',
        }}>Doctor Sasi</p>
      </div>

      {/* TOP RIGHT — whisper — hidden mobile */}
      <div className="hero-side-text" style={{
        position: 'absolute', top: '12%', right: '6%', zIndex: 3,
        pointerEvents: 'none', textAlign: 'right',
        animation: 'hfade 1.8s ease 0.8s both',
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(1rem,2vw,1.5rem)',
          color: 'rgba(255,255,255,0.75)', lineHeight: 1.5,
          textShadow: '0 2px 20px rgba(0,0,0,0.9)',
        }}>
          Look at her.
        </p>
        <p style={{
          margin: '4px 0 0',
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(0.75rem,1.3vw,1rem)',
          color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
          textShadow: '0 2px 16px rgba(0,0,0,0.9)',
        }}>She never gave up on you.</p>
      </div>

      {/* LEFT MIDDLE — hidden mobile */}
      <div className="hero-side-text" style={{
        position: 'absolute', left: '5%', top: '38%', zIndex: 3,
        pointerEvents: 'none', maxWidth: 240,
        animation: 'hfade 2s ease 1.2s both',
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(1.2rem,2.2vw,1.9rem)',
          color: 'rgba(255,255,255,0.82)', lineHeight: 1.4,
          textShadow: '0 2px 24px rgba(0,0,0,0.95)',
        }}>
          You were<br />never broken.
        </p>
        <p style={{
          margin: '10px 0 0',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          textShadow: '0 1px 12px rgba(0,0,0,0.9)',
        }}>Just unheard.</p>
      </div>

      {/* CENTRE — main headline, fully responsive */}
      <div className="hero-content" style={{
        position: 'absolute', inset: 0, zIndex: 3,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', padding: '0 20px',
      }}>
        <p style={{
          margin: '0 0 14px',
          color: 'rgba(255,255,255,0.55)',
          fontSize: 'clamp(0.45rem,1.8vw,0.6rem)', letterSpacing: '0.3em', textTransform: 'uppercase',
          textShadow: '0 1px 8px rgba(0,0,0,0.8)', textAlign: 'center',
        }}>Move your cursor · the truth is waiting</p>

        <span style={{
          display: 'block', textAlign: 'center', lineHeight: 0.95,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(3.2rem,12vw,8.5rem)', color: '#fff',
          textShadow: '0 4px 60px rgba(0,0,0,0.7)',
        }}>Beneath</span>
        <span style={{
          display: 'block', textAlign: 'center', lineHeight: 1, marginTop: '-0.02em',
          fontSize: 'clamp(2rem,7.5vw,5.5rem)', color: 'rgba(255,255,255,0.92)',
          fontWeight: 300, letterSpacing: '-0.02em',
          textShadow: '0 4px 60px rgba(0,0,0,0.7)',
        }}>lies your glow</span>

        <p style={{
          margin: '20px 0 0',
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          color: 'rgba(255,255,255,0.65)',
          fontSize: 'clamp(0.78rem,2.2vw,1.2rem)',
          textAlign: 'center', maxWidth: '88vw', lineHeight: 1.8,
          textShadow: '0 2px 20px rgba(0,0,0,0.9)',
        }}>
          Most people spend their whole life<br />
          in skin that was never truly heard.
        </p>
      </div>

      {/* RIGHT MIDDLE — hidden mobile */}
      <div className="hero-side-text" style={{
        position: 'absolute', right: '5%', bottom: '30%', zIndex: 3,
        pointerEvents: 'none', textAlign: 'right',
        animation: 'hfade 2s ease 1.6s both',
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(0.9rem,1.5vw,1.2rem)',
          color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
          textShadow: '0 2px 20px rgba(0,0,0,0.95)',
        }}>
          This is what<br />
          <span style={{ fontSize: '1.4em', color: '#fff', textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>alive</span><br />
          feels like.
        </p>
      </div>

      {/* BOTTOM LEFT — truth pair, repositioned on mobile */}
      <div className="hero-bottom-truth" style={{
        position: 'absolute', bottom: 52, left: 20, zIndex: 3,
        pointerEvents: 'none', animation: 'hfade 2s ease 1.8s both',
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(0.9rem,1.4vw,1.1rem)',
          color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
          textShadow: '0 2px 16px rgba(0,0,0,0.95)',
        }}>dead on the surface.</p>
        <p style={{
          margin: 0,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(0.9rem,1.4vw,1.1rem)',
          color: 'rgba(255,255,255,0.82)', lineHeight: 1.6,
          textShadow: '0 2px 16px rgba(0,0,0,0.95)',
        }}>alive underneath.</p>
      </div>

      {/* scroll cue */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', opacity: 0.25, zIndex: 3, pointerEvents: 'none',
      }}>
        <div style={{ width: 1, height: 36, margin: '0 auto', background: 'linear-gradient(to bottom,rgba(255,255,255,0.6),transparent)' }} />
      </div>
    </div>
  );
}

/* ─── SECTION 2: Centered video card + marquee text layers ─── */
function VideoSection() {
  const outerRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames    = useRef<HTMLImageElement[]>([]);
  const idxRef    = useRef(0);
  const prevRef   = useRef(-1);
  const raf       = useRef<number | null>(null);
  const [pct,   setPct]   = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let done = 0;
    for (let i = 1; i <= TOTAL; i++) {
      const img = new Image();
      img.src = FRAME(i);
      img.onload = () => {
        done++;
        setPct(Math.round(done / TOTAL * 100));
        if (done === 1) setReady(true);
      };
      imgs.push(img);
    }
    frames.current = imgs;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const outer = outerRef.current;
      if (!outer) return;
      const scrollable = outer.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, (window.scrollY - outer.offsetTop) / scrollable));
      idxRef.current = Math.min(Math.round(p * (TOTAL - 1)), TOTAL - 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx  = canvas.getContext('2d', { alpha: false })!;
    const paint = () => {
      const i   = idxRef.current;
      const img = frames.current[i];
      if (img?.complete && img.naturalWidth > 0 && i !== prevRef.current) {
        prevRef.current = i;
        const rect = canvas.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w > 0 && h > 0) {
          const pw = Math.round(w * dpr);
          const ph = Math.round(h * dpr);
          if (canvas.width !== pw || canvas.height !== ph) {
            canvas.width = pw; canvas.height = ph;
          }
          ctx.save();
          ctx.scale(dpr, dpr);
          const iAR = img.naturalWidth / img.naturalHeight;
          const cAR = w / h;
          let dw = w, dh = h, ox = 0, oy = 0;
          if (iAR > cAR) { dw = h * iAR; ox = (dw - w) / 2; }
          else            { dh = w / iAR; oy = (dh - h) / 2; }
          ctx.drawImage(img, -ox, -oy, dw, dh);
          ctx.restore();
        }
      }
      raf.current = requestAnimationFrame(paint);
    };
    raf.current = requestAnimationFrame(paint);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  const marqueeLeft  = 'Clinical Skincare Intelligence · Doctor Sasi · Beneath Lies Your Glow · Science of Beauty · ';
  const marqueeRight = 'Ingredients Matter · Skin First · Trusted Formulas · Dermatologist Approved · Feel the Difference · ';

  // refs for the 3 marquee rows — driven by scroll
  const m0 = useRef<HTMLDivElement>(null);
  const m1 = useRef<HTMLDivElement>(null);
  const m2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let driftRaf: number;

    const drift = () => {
      const outer = outerRef.current;
      if (outer) {
        const scrollable = outer.offsetHeight - window.innerHeight;
        const p = Math.max(0, Math.min(1, (window.scrollY - outer.offsetTop) / scrollable));
        const scrollOffset = p * 80;

        if (m0.current) m0.current.style.transform = `translateX(${-scrollOffset * 0.5}%)`;
        if (m1.current) m1.current.style.transform = `translateX(${-25 + scrollOffset * 0.4}%)`;
        if (m2.current) m2.current.style.transform = `translateX(${-scrollOffset * 0.6}%)`;
      }

      driftRaf = requestAnimationFrame(drift);
    };
    driftRaf = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(driftRaf);
  }, []);

  return (
    <div ref={outerRef} style={{ height: '400vh' }}>
      <div style={{
        position: 'sticky', top: 0,
        width: '100%', height: '100vh',
        overflow: 'hidden', background: '#040406',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>

        {/* ── 3 scroll-driven marquee rows filling full height, no gaps ── */}
        <div style={{
          position: 'absolute', inset: 0,
          overflow: 'hidden', zIndex: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'stretch',
        }}>
          {[
            { ref: m0, italic: true,  opacity: 0.09, init: '0%' },
            { ref: m1, italic: false, opacity: 0.07, init: '-25%' },
            { ref: m2, italic: true,  opacity: 0.08, init: '0%' },
          ].map((row, i) => (
            <div key={i} style={{
              flex: '1 1 33.333%', overflow: 'hidden',
              display: 'flex', alignItems: 'stretch',
            }}>
              <div ref={row.ref} style={{
                display: 'flex', whiteSpace: 'nowrap', alignItems: 'center',
                transform: `translateX(${row.init})`,
                willChange: 'transform', width: '100%',
              }}>
                {[0,1,2,3,4,5].map(k => (
                  <span key={k} style={{
                    fontSize: '33.4vh',
                    fontFamily: row.italic ? "'Playfair Display',serif" : 'Inter,sans-serif',
                    fontStyle: row.italic ? 'italic' : 'normal',
                    fontWeight: row.italic ? 400 : 800,
                    textTransform: row.italic ? 'none' : 'uppercase',
                    letterSpacing: row.italic ? '-0.02em' : '0.06em',
                    color: `rgba(255,255,255,${row.opacity})`,
                    userSelect: 'none', paddingRight: '1rem',
                    lineHeight: 1, display: 'block',
                  }}>{i === 1 ? marqueeRight : marqueeLeft}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── centered video card — above marquee ── */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 820, padding: '0 24px' }}>
          <div style={{
            width: '100%', aspectRatio: '16/9',
            borderRadius: 14, overflow: 'hidden',
            background: '#050505',
            boxShadow: '0 8px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.07)',
            position: 'relative',
          }}>
            <canvas ref={canvasRef} style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', display: 'block',
            }} />

            {!ready && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: '#050505',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{
                  width: 1, height: 48,
                  background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.3),transparent)',
                  animation: 'fp 1.6s ease-in-out infinite',
                }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                  {pct}%
                </span>
              </div>
            )}

            {ready && pct < 100 && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
                height: 2, background: 'rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  height: '100%', background: 'rgba(255,255,255,0.5)',
                  width: `${pct}%`, transition: 'width 0.3s linear',
                }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SECTION 3: Sesi chat — premium dark UI ─── */
function ChatSection() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#040406', overflow: 'hidden' }}>

      {/* ambient glow blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '10%', left: '10%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(180,140,255,0.06) 0%,transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '8%',
          width: '35vw', height: '35vw', borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(100,200,220,0.05) 0%,transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '80px 20px 100px',
      }}>

        {/* eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 32, height: 1, background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.2))' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* live dot */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#4ade80',
              display: 'inline-block',
              animation: 'pulse-dot 1.8s ease-in-out infinite',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem', letterSpacing: '0.36em', textTransform: 'uppercase' }}>
              Clinical AI · Live
            </span>
          </div>
          <div style={{ width: 32, height: 1, background: 'linear-gradient(to left,transparent,rgba(255,255,255,0.2))' }} />
        </div>

        {/* headline */}
        <h2 style={{
          margin: '0 0 10px', textAlign: 'center',
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(2.2rem,4vw,3.4rem)', color: '#ffffff',
          fontWeight: 400, lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          Your skin deserves answers.
        </h2>
        <p style={{
          margin: '0 0 48px', textAlign: 'center', maxWidth: 400,
          color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem',
          fontWeight: 300, lineHeight: 1.75, fontStyle: 'italic',
          fontFamily: "'Playfair Display',serif",
        }}>
          She remembers. She listens. She cares.
        </p>

        {/* skin concern tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {['Acne & Breakouts','Dark Spots','Anti-Aging','Hydration','Sensitive Skin','Glow & Radiance','Pores','Redness'].map((tag, i) => (
            <span key={i} style={{
              padding: '5px 14px', borderRadius: 100,
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.03)',
            }}>{tag}</span>
          ))}
        </div>

        {/* stats row */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 48, justifyContent: 'center' }}>
          {[
            { n: '12k+', label: 'Skin Profiles' },
            { n: '98%',  label: 'Accuracy' },
            { n: '4.9★', label: 'Rating' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 'clamp(1.4rem,2.5vw,2rem)', color: '#fff', fontWeight: 300, letterSpacing: '-0.02em' }}>{s.n}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* chat shell */}
        <div style={{
          width: '100%', maxWidth: 820, position: 'relative',
          animation: 'chat-float 6s ease-in-out infinite',
        }}>

          {/* spinning border glow */}
          <div style={{
            position: 'absolute', inset: -1, borderRadius: 24, zIndex: 0,
            background: 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03),rgba(180,140,255,0.1),rgba(100,200,220,0.08))',
            padding: 1,
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 23, background: '#0a0a0f' }} />
          </div>

          {/* main card */}
          <div style={{
            position: 'relative', zIndex: 1,
            borderRadius: 22,
            background: 'linear-gradient(160deg,#0e0e16 0%,#080810 100%)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>

            {/* header bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* real-life doctor avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <style>{`
                    @keyframes sesi-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
                    @keyframes sesi-blink { 0%,90%,100%{scaleY:1} 95%{transform:scaleY(0.1)} }
                    @keyframes sesi-glow  { 0%,100%{box-shadow:0 0 0 3px rgba(168,85,247,0.2),0 4px 20px rgba(168,85,247,0.3)} 50%{box-shadow:0 0 0 4px rgba(232,121,249,0.35),0 4px 28px rgba(232,121,249,0.45)} }
                    .sesi-avatar { animation: sesi-bob 3s ease-in-out infinite, sesi-glow 3s ease-in-out infinite; }
                    .sesi-eye-l  { animation: sesi-blink 4s ease-in-out infinite; transform-origin: center; }
                    .sesi-eye-r  { animation: sesi-blink 4s ease-in-out infinite 0.1s; transform-origin: center; }
                  `}</style>
                  <div className="sesi-avatar" style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(160deg,#1e0f3a,#2d1255)',
                    border: '1.5px solid rgba(232,121,249,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', cursor: 'default',
                  }}>
                    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* hair back */}
                      <ellipse cx="20" cy="14" rx="10" ry="11" fill="#7c3aed"/>
                      {/* hair shine */}
                      <ellipse cx="16" cy="9" rx="3" ry="1.5" fill="rgba(255,255,255,0.18)" transform="rotate(-20 16 9)"/>
                      {/* face */}
                      <ellipse cx="20" cy="15.5" rx="8.5" ry="9" fill="#fddcb5"/>
                      {/* blush left */}
                      <ellipse cx="13.5" cy="18" rx="2.5" ry="1.4" fill="rgba(255,160,160,0.45)"/>
                      {/* blush right */}
                      <ellipse cx="26.5" cy="18" rx="2.5" ry="1.4" fill="rgba(255,160,160,0.45)"/>
                      {/* eye left */}
                      <g className="sesi-eye-l">
                        <ellipse cx="16.5" cy="15" rx="1.6" ry="1.8" fill="#2d1b69"/>
                        <ellipse cx="17.1" cy="14.3" rx="0.5" ry="0.5" fill="white"/>
                      </g>
                      {/* eye right */}
                      <g className="sesi-eye-r">
                        <ellipse cx="23.5" cy="15" rx="1.6" ry="1.8" fill="#2d1b69"/>
                        <ellipse cx="24.1" cy="14.3" rx="0.5" ry="0.5" fill="white"/>
                      </g>
                      {/* nose */}
                      <ellipse cx="20" cy="18.5" rx="0.8" ry="0.6" fill="rgba(180,100,60,0.3)"/>
                      {/* big smile */}
                      <path d="M15.5 21 Q20 25 24.5 21" stroke="#e07060" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                      {/* teeth */}
                      <path d="M17 21.5 Q20 23.5 23 21.5" fill="white" opacity="0.9"/>
                      {/* hair fringe */}
                      <path d="M11 13 Q13 7 20 7 Q27 7 29 13 Q26 10 20 10.5 Q14 10 11 13Z" fill="#6d28d9"/>
                      {/* side hair strands */}
                      <path d="M11.5 14 Q10 18 11 22" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      <path d="M28.5 14 Q30 18 29 22" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      {/* neck */}
                      <rect x="17" y="23.5" width="6" height="3" rx="1.5" fill="#fddcb5"/>
                      {/* white coat */}
                      <path d="M8 40 Q10 28 17 26 L20 28 L23 26 Q30 28 32 40Z" fill="white"/>
                      {/* coat shadow/fold */}
                      <path d="M20 28 L18 32 L20 31Z" fill="#e8d8f8"/>
                      <path d="M20 28 L22 32 L20 31Z" fill="#e8d8f8"/>
                      {/* scrubs/shirt under coat */}
                      <path d="M14 40 Q15 30 20 29 Q25 30 26 40Z" fill="#c084fc" opacity="0.6"/>
                      {/* stethoscope */}
                      <path d="M15 29 Q13 32 13.5 35 Q14 37 16 37 Q18 37 18 35.5" stroke="#f0abfc" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
                      <circle cx="18" cy="35.5" r="1.5" fill="none" stroke="#f0abfc" strokeWidth="1.2"/>
                      <circle cx="18" cy="35.5" r="0.6" fill="#f0abfc"/>
                      {/* pocket + red cross */}
                      <rect x="23" y="31" width="5" height="4" rx="0.8" fill="rgba(255,255,255,0.6)"/>
                      <rect x="25" y="31.8" width="1" height="2.4" rx="0.4" fill="#f87171"/>
                      <rect x="24.2" y="32.6" width="2.6" height="1" rx="0.4" fill="#f87171"/>
                    </svg>
                  </div>
                  {/* animated online dot */}
                  <span style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#4ade80',
                    border: '2px solid #0a0a12',
                    boxShadow: '0 0 8px rgba(74,222,128,0.7)',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.01em' }}>Doctor Sesi</p>
                  <p style={{ margin: 0, color: 'rgba(74,222,128,0.9)', fontSize: '0.56rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>● Online now</p>
                </div>
              </div>
              {/* right meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.2)', fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Clinical AI</p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.12)', fontSize: '0.5rem', letterSpacing: '0.15em' }}>Shanfa Global</p>
                </div>
                {/* 3 dots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* scan line animation over chat */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 1, zIndex: 10,
                background: 'linear-gradient(to right,transparent,rgba(192,132,252,0.4),transparent)',
                animation: 'scan-line 5s linear infinite',
                pointerEvents: 'none',
              }} />

              {/* SesiChat — dark shell */}
              <div
                className="sesi-dark-shell"
                style={{
                  height: 600,
                  background: 'linear-gradient(160deg,#0c0a1a 0%,#080810 100%)',
                  position: 'relative', zIndex: 1,
                  colorScheme: 'dark',
                }}
              >
                <SesiChat />
              </div>
            </div>

            {/* footer bar */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.015)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.12)', fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                End-to-end encrypted · Private
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {['rgba(255,100,100,0.4)','rgba(255,200,0,0.4)','rgba(80,220,100,0.4)'].map((c,i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* bottom caption */}
        <p style={{
          marginTop: 36, color: 'rgba(255,255,255,0.1)',
          fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          Doctor Sasi · Clinical Skincare Intelligence · Shanfa Global
        </p>
      </div>
    </div>
  );
}
