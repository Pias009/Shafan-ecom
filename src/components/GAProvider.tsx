'use client';

import { GoogleAnalytics } from '@next/third-parties/google';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GAProvider() {
  if (!GA_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GA] NEXT_PUBLIC_GA_ID not set');
    }
    return null;
  }

  return <GoogleAnalytics gaId={GA_ID} />;
}
