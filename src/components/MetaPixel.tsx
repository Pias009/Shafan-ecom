'use client';

import Script from 'next/script';

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

interface MetaPixelProps {
  debugMode?: boolean;
}

export function MetaPixel({ debugMode = false }: MetaPixelProps) {
  if (!FB_PIXEL_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Meta Pixel] NEXT_PUBLIC_FB_PIXEL_ID not set');
    }
    return null;
  }

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}', {}, { 
            debug: ${debugMode},
            version: 'v21.0'
          });
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { fbq?: () => void }).fbq) {
    (window as unknown as { fbq: (cmd: string, event: string, data?: Record<string, unknown>) => void }).fbq(
      'track',
      eventName,
      params
    );
  }
}