'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export function GAProvider() {
  if (!GA_ID && !ADS_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Tracking] Neither GA_ID nor ADS_ID set');
    }
    return null;
  }

  return (
    <>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      {ADS_ID && (
        <Script
          id="google-ads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.gtag('config', '${ADS_ID}');
            `,
          }}
        />
      )}
    </>
  );
}
