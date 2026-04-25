'use client';

export function fbEvent(
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventId?: string }
) {
  if (typeof window === 'undefined') return;
  
  const win = window as unknown as {
    fbq?: (cmd: string, event: string, data?: Record<string, unknown>, options?: Record<string, string>) => void;
  };
  
  if (!win.fbq) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Meta Pixel] fbq not loaded');
    }
    return;
  }
  
  win.fbq('track', eventName, params, options?.eventId ? { eventID: options.eventId } : undefined);
}

export function generateEventId(orderId: string): string {
  return `purchase_${orderId}_${Date.now()}`;
}