const DEFAULT_CURRENCY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
  ? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
  : 'AED';

import { fbEvent } from './fpixel';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type DataLayerEvent = Record<string, unknown>;

let trackingQueue: any[] = [];
let trackingTimeout: NodeJS.Timeout | null = null;

export function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;

  // Immediate push to GTM/DataLayer for real-time tracking
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);

  // Also fire directly to GA4 via gtag for ecommerce events
  // This ensures events reach GA4 even without GTM tag configuration
  if (typeof window.gtag === 'function') {
    const ecommerce = (event as any).ecommerce;
    if (ecommerce || event.event === 'search' || event.event === 'sign_up' || event.event === 'contact') {
      const gtagParams: Record<string, unknown> = { ...ecommerce };
      // For purchase events, ensure proper GA4 format
      if (event.event === 'purchase' && ecommerce) {
        gtagParams.transaction_id = ecommerce.transaction_id;
        gtagParams.value = ecommerce.value;
        gtagParams.currency = ecommerce.currency;
        gtagParams.items = ecommerce.items;
      }
      window.gtag('event', event.event as string, gtagParams);
    }
  }

  // Debounced logging to our internal tracking API to save bandwidth/CPU
  trackingQueue.push({
    eventType: event.event || 'unknown',
    eventData: event,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString()
  });

  if (trackingTimeout) clearTimeout(trackingTimeout);
  
  trackingTimeout = setTimeout(() => {
    const batch = [...trackingQueue];
    trackingQueue = [];
    trackingTimeout = null;

    if (batch.length === 0) return;

    fetch('/api/tracking/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    }).catch((err) => console.error('Failed to log tracking batch:', err));
  }, 2000); // 2 second debounce for internal logs
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('tracking_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tracking_session_id', sessionId);
  }
  return sessionId;
}

export function trackViewItem(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
  category?: string;
  brand?: string;
  variant?: string;
  sku?: string;
}): void {
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: product.currency || DEFAULT_CURRENCY,
      value: product.price,
      items: [
        {
          item_id: product.sku || product.id,
          item_name: product.name,
          price: product.price,
          quantity: 1,
          item_category: product.category,
          item_brand: product.brand,
          variant: product.variant,
        },
      ],
    },
  });

  // Meta Pixel ViewContent
  if (product.id) {
    fbEvent('ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: (product.currency || DEFAULT_CURRENCY).toUpperCase(),
      content_category: product.category,
    });
  }
}

export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
  category?: string;
  brand?: string;
  variant?: string;
  quantity?: number;
  sku?: string;
}): void {
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: product.currency || DEFAULT_CURRENCY,
      value: product.price * (product.quantity || 1),
      items: [
        {
          item_id: product.sku || product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          item_category: product.category,
          item_brand: product.brand,
          variant: product.variant,
        },
      ],
    },
  });

  // Meta Pixel AddToCart
  if (product.id) {
    fbEvent('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * (product.quantity || 1),
      currency: (product.currency || DEFAULT_CURRENCY).toUpperCase(),
      content_category: product.category,
    });
  }
}

export function trackBeginCheckout(cart: {
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    brand?: string;
    variant?: string;
    sku?: string;
  }[];
  currency?: string;
  value: number;
}): void {
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: cart.currency || DEFAULT_CURRENCY,
      value: cart.value,
      items: cart.items.map((item) => ({
        item_id: item.sku || item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
        item_brand: item.brand,
        variant: item.variant,
      })),
    },
  });

  // Meta Pixel InitiateCheckout
  fbEvent('InitiateCheckout', {
    content_ids: cart.items.map(i => i.id).filter(Boolean),
    content_type: 'product',
    value: cart.value,
    currency: (cart.currency || DEFAULT_CURRENCY).toUpperCase(),
    num_items: cart.items.length,
  });
}

export function trackAddPaymentInfo(order: {
  id: string;
  value: number;
  currency?: string;
  paymentMethod?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
  }[];
}): void {
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      currency: order.currency || DEFAULT_CURRENCY,
      value: order.value,
      payment_type: order.paymentMethod,
      items: order.items.map((item) => ({
        item_id: item.sku || item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });

  // ✅ Meta Pixel AddPaymentInfo
  fbEvent('AddPaymentInfo', {
    content_ids: order.items.map(i => i.id).filter(Boolean),
    content_type: 'product',
    value: order.value,
    currency: (order.currency || DEFAULT_CURRENCY).toUpperCase(),
    num_items: order.items.length,
  });
}

export function trackPurchase(order: {
  id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  coupon?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    brand?: string;
    variant?: string;
    sku?: string;
  }[];
}, eventId?: string): void {
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.id,
      value: order.value,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      currency: order.currency || DEFAULT_CURRENCY,
      coupon: order.coupon,
      items: order.items.map((item) => ({
        item_id: item.sku || item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
        item_brand: item.brand,
        variant: item.variant,
      })),
    },
  });

  // Meta Pixel Purchase
  fbEvent('Purchase', {
    content_ids: order.items.map(i => i.id).filter(Boolean),
    content_type: 'product',
    value: order.value,
    currency: (order.currency || DEFAULT_CURRENCY).toUpperCase(),
    num_items: order.items.length,
  }, { eventId: eventId || `purchase_${order.id}` });
}


