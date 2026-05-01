'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export function MetaPixelProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) return;

    // Standard Pixel Initialization
    if (!(window as any).fbq) {
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      (window as any).fbq('init', PIXEL_ID);
    }

    (window as any).fbq('track', 'PageView');
  }, [pathname]);

  if (!PIXEL_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Meta Pixel] NEXT_PUBLIC_FB_PIXEL_ID not set');
    }
    return null;
  }

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
