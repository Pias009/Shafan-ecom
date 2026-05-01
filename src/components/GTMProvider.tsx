'use client';

import { GoogleTagManager } from '@next/third-parties/google';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GTMProvider() {
  if (!GTM_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GTM] NEXT_PUBLIC_GTM_ID not set');
    }
    return null;
  }

  return <GoogleTagManager gtmId={GTM_ID} />;
}
