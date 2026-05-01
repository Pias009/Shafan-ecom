import { NextResponse } from 'next/server';

export async function GET() {
  const credentials = {
    gtm: {
      id: process.env.NEXT_PUBLIC_GTM_ID || null,
      configured: !!process.env.NEXT_PUBLIC_GTM_ID,
    },
    googleAnalytics: {
      id: process.env.NEXT_PUBLIC_GA_ID || null,
      configured: !!process.env.NEXT_PUBLIC_GA_ID,
    },
    metaPixel: {
      id: process.env.NEXT_PUBLIC_FB_PIXEL_ID || null,
      configured: !!process.env.NEXT_PUBLIC_FB_PIXEL_ID,
    },
    metaConversionsApi: {
      configured: !!process.env.FB_ACCESS_TOKEN,
    },
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
    },
    shippo: {
      configured: !!process.env.SHIPPO_API_KEY,
    },
  };

  return NextResponse.json(credentials);
}
