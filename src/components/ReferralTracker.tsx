'use client';

import { useEffect } from 'react';

function getReferralSource(): string {
  if (typeof window === 'undefined') return 'direct';

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const gclid = params.get('gclid');
  const fbclid = params.get('fbclid');
  const ttclid = params.get('ttclid');

  if (gclid) return 'google_ads';
  if (fbclid) return 'facebook';
  if (ttclid) return 'tiktok';
  if (utmSource) {
    const source = utmSource.toLowerCase().trim();
    if (['google', 'facebook', 'instagram', 'twitter', 'x', 'linkedin', 'youtube', 'pinterest', 'tiktok', 'snapchat', 'whatsapp', 'telegram'].includes(source)) {
      return source === 'x' ? 'twitter' : source;
    }
    return source;
  }

  const referrer = document.referrer?.toLowerCase() || '';
  if (!referrer) return 'direct';

  try {
    const url = new URL(referrer);
    const hostname = url.hostname;

    if (hostname.includes('google.')) return 'google';
    if (hostname.includes('facebook.') || hostname.includes('fb.')) return 'facebook';
    if (hostname.includes('instagram.')) return 'instagram';
    if (hostname.includes('twitter.') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('linkedin.')) return 'linkedin';
    if (hostname.includes('youtube.')) return 'youtube';
    if (hostname.includes('pinterest.')) return 'pinterest';
    if (hostname.includes('tiktok.')) return 'tiktok';
    if (hostname.includes('snapchat.')) return 'snapchat';
    if (hostname.includes('whatsapp.')) return 'whatsapp';
    if (hostname.includes('telegram.')) return 'telegram';
    if (hostname.includes('bing.') || hostname.includes('yahoo.') || hostname.includes('duckduckgo.')) return 'search_engine';
    if (hostname.includes('mail.') || hostname.includes('outlook.') || hostname.includes('yahoo.com/mail')) return 'email';

    return 'other';
  } catch {
    return 'other';
  }
}

function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function ReferralTracker() {
  useEffect(() => {
    const existing = document.cookie
      .split('; ')
      .find(row => row.startsWith('referral_source='));

    if (!existing) {
      const source = getReferralSource();
      setCookie('referral_source', source);
    }
  }, []);

  return null;
}
