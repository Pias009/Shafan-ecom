declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const DEFAULT_CURRENCY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
  ? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
  : 'AED';

type DataLayerEvent = Record<string, unknown>;

export function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);

  // Log to our tracking API
  fetch('/api/tracking/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: event.event || 'unknown',
      eventData: event,
      sessionId: getSessionId(),
    }),
  }).catch((err) => console.error('Failed to log tracking event:', err));
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
}): void {
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: product.currency || DEFAULT_CURRENCY,
      value: product.price,
      items: [
        {
          item_id: product.id,
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
}): void {
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: product.currency || DEFAULT_CURRENCY,
      value: product.price * (product.quantity || 1),
      items: [
        {
          item_id: product.id,
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
}

export function trackRemoveFromCart(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
  category?: string;
  quantity?: number;
}): void {
  pushToDataLayer({
    event: 'remove_from_cart',
    ecommerce: {
      currency: product.currency || DEFAULT_CURRENCY,
      value: product.price * (product.quantity || 1),
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          item_category: product.category,
        },
      ],
    },
  });
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
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
        item_brand: item.brand,
        variant: item.variant,
      })),
    },
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
  }[];
}): void {
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
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
        item_brand: item.brand,
        variant: item.variant,
      })),
    },
  });
}

export function trackViewItemList(items: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  index?: number;
}[]): void {
  pushToDataLayer({
    event: 'view_item_list',
    ecommerce: {
      items: items.map((item, idx) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category,
        item_brand: item.brand,
        index: item.index ?? idx + 1,
      })),
    },
  });
}

export function trackSearch(query: string, resultsCount?: number): void {
  pushToDataLayer({
    event: 'search',
    search_term: query,
    search_results_count: resultsCount,
  });
}
