// Signed admin session tokens.
//
// Format: v2.<base64url(JSON payload)>.<base64url(HMAC-SHA256)>
// Uses Web Crypto only, so the same code verifies tokens in middleware and in
// Node route handlers. Legacy unsigned tokens (base64 "userId:ts:admin") are
// rejected — they could be forged by anyone who knew an admin's user id.

export const ADMIN_COOKIE = 'admin-session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export type AdminTokenPayload = {
  uid: string;
  iat: number; // issued at (seconds)
  exp: number; // expires at (seconds)
};

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SESSION_SECRET or NEXTAUTH_SECRET must be set');
  }
  return 'dev-only-admin-session-secret';
}

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(getSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    keyPromise.catch(() => { keyPromise = null; });
  }
  return keyPromise;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function signAdminToken(uid: string, maxAgeSeconds = ADMIN_SESSION_MAX_AGE): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = { uid, iat, exp: iat + maxAgeSeconds };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(`v2.${body}`));
  return `v2.${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyAdminToken(token: string | null | undefined): Promise<AdminTokenPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v2') return null;

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      fromBase64Url(parts[2]),
      encoder.encode(`v2.${parts[1]}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1]))) as AdminTokenPayload;
    if (!payload?.uid || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
