import crypto from 'crypto';

export function generateEventId(orderId: string, timestamp: number): string {
  return `order_${orderId}_${timestamp}`;
}

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}
