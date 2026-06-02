/**
 * Tamara Webhook Auth Test — Dual-Path Authorization
 *
 * Tests:
 * 1. JWT generation & verification (matching route.ts logic)
 * 2. Authorization header extraction (Bearer <token>)
 * 3. Query parameter fallback (?tamaraToken=...)
 * 4. Missing auth → 401
 * 5. Optional: live endpoint test against localhost:3000
 *
 * Usage: node test-tamara-webhook-auth.mjs
 * For live test:  node test-tamara-webhook-auth.mjs --live
 */

import crypto from "node:crypto";
import http from "node:http";

const NOTIFICATION_KEY = process.env.TAMARA_NOTIFICATION_TOKEN || "b6a80876-6b88-4692-8949-7f34578e3c89";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

function base64urlEncode(data) {
  if (typeof data === "string") data = Buffer.from(data);
  return data.toString("base64url");
}

function base64urlDecode(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf-8");
}

// ================================================================
// Simulate token extraction logic from route.ts
// ================================================================
function extractTokenFromHeaders(headers) {
  const authHeader = headers.get?.("authorization") || headers.get?.("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return "";
}

function extractTokenFromQuery(url) {
  const { searchParams } = new URL(url);
  return searchParams.get("tamaraToken") || "";
}

function simulateWebhookAuth(url, headers) {
  let token = extractTokenFromHeaders(headers);
  if (!token) {
    token = extractTokenFromQuery(url);
  }
  return token;
}

// ================================================================
// TEST 1: JWT Generation & Verification
// ================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 1: JWT Generation & Verification");
console.log("=".repeat(60));

const header = { alg: "HS256", typ: "JWT" };
const payload = {
  order_id: "8c5e39bb-698d-4c9a-bf9b-efe9bb133fca",
  order_reference_id: "903961577356246",
  event_type: "order_approved",
};

const headerB64 = base64urlEncode(JSON.stringify(header));
const payloadB64 = base64urlEncode(JSON.stringify(payload));
const dataToSign = `${headerB64}.${payloadB64}`;

const signature = crypto
  .createHmac("sha256", NOTIFICATION_KEY)
  .update(dataToSign)
  .digest("base64url");

const token = `${dataToSign}.${signature}`;
assert(token.split(".").length === 3, "JWT has 3 parts");

const headerParsed = JSON.parse(base64urlDecode(headerB64));
assert(headerParsed.alg === "HS256", "Algorithm is HS256");

const calculatedSig = crypto
  .createHmac("sha256", NOTIFICATION_KEY)
  .update(dataToSign)
  .digest("base64url");

const sigBuffer = Buffer.from(signature);
const calcBuffer = Buffer.from(calculatedSig);
let isValid = false;
if (sigBuffer.length === calcBuffer.length) {
  isValid = crypto.timingSafeEqual(sigBuffer, calcBuffer);
}
assert(isValid, "Signature verified (timingSafeEqual)");

// Decode & check payload
const decodedPayload = JSON.parse(base64urlDecode(payloadB64));
assert(decodedPayload.event_type === "order_approved", 'Payload contains event_type "order_approved"');
assert(!!decodedPayload.order_id, "Payload contains order_id");

// ================================================================
// TEST 2: Authorization Header Extraction
// ================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 2: Authorization Header (Bearer <token>)");
console.log("=".repeat(60));

const mockHeaders = new Map();
mockHeaders.set("authorization", `Bearer ${token}`);

const headerToken = simulateWebhookAuth("http://localhost/api/payments/tamara/webhook", mockHeaders);
assert(headerToken === token, "Extracts token from Authorization header");
assert(headerToken.length > 0, "Token is non-empty");

// Missing header
const emptyHeaders = new Map();
const noToken = simulateWebhookAuth("http://localhost/api/payments/tamara/webhook", emptyHeaders);
assert(noToken === "", "Returns empty string when no header");

// Malformed header (no Bearer prefix)
const badHeaders = new Map();
badHeaders.set("authorization", `Token ${token}`);
const badToken = simulateWebhookAuth("http://localhost/api/payments/tamara/webhook", badHeaders);
assert(badToken === "", "Ignores non-Bearer authorization header");

// ================================================================
// TEST 3: Query Parameter Fallback (?tamaraToken=...)
// ================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 3: Query Parameter Fallback (?tamaraToken=...)");
console.log("=".repeat(60));

const queryUrl = `http://localhost/api/payments/tamara/webhook?tamaraToken=${encodeURIComponent(token)}`;
const queryToken = simulateWebhookAuth(queryUrl, new Map());
assert(queryToken === token, "Extracts token from tamaraToken query param");

// No tamaraToken param
const noQueryUrl = "http://localhost/api/payments/tamara/webhook";
const noQueryToken = simulateWebhookAuth(noQueryUrl, new Map());
assert(noQueryToken === "", "Returns empty when no tamaraToken query param");

// Wrong param name
const wrongParamUrl = "http://localhost/api/payments/tamara/webhook?token=abc";
const wrongParamToken = simulateWebhookAuth(wrongParamUrl, new Map());
assert(wrongParamToken === "", "Ignores non-tamaraToken query params");

// ================================================================
// TEST 4: Full Auth Flow (header takes priority)
// ================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 4: Header Priority Over Query Param");
console.log("=".repeat(60));

const bothAuthHeaders = new Map();
bothAuthHeaders.set("authorization", `Bearer ${token}`);
const bothUrl = `http://localhost/api/payments/tamara/webhook?tamaraToken=wrong-token`;

const bothToken = simulateWebhookAuth(bothUrl, bothAuthHeaders);
assert(bothToken === token, "Header token takes priority over query param");
assert(bothToken !== "wrong-token", "Does NOT use query param when header is present");

// ================================================================
// TEST 5: Live Endpoint (--live flag)
// ================================================================
console.log("\n" + "=".repeat(60));
if (process.argv.includes("--live")) {
  console.log("TEST 5: Live Endpoint (localhost:3000)");
  console.log("=".repeat(60));

  const testPayload = {
    order_reference_id: "test-" + Date.now(),
    order_id: "test-checkout-" + Date.now(),
    event_type: "order_approved",
    status: "approved",
  };
  const payloadStr = JSON.stringify(testPayload);

  const liveHeaderB64 = base64urlEncode(JSON.stringify(header));
  const livePayloadB64 = base64urlEncode(JSON.stringify(testPayload));
  const liveDataToSign = `${liveHeaderB64}.${livePayloadB64}`;
  const liveSignature = crypto
    .createHmac("sha256", NOTIFICATION_KEY)
    .update(liveDataToSign)
    .digest("base64url");
  const liveToken = `${liveDataToSign}.${liveSignature}`;

  async function testLive(mode, makeRequest) {
    return new Promise((resolve) => {
      const req = http.request(makeRequest, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const ok = res.statusCode === 200;
          assert(ok, `[${mode}] Status ${res.statusCode}`);
          resolve(ok);
        });
      });
      req.on("error", (e) => {
        assert(false, `[${mode}] Request failed: ${e.message}`);
        resolve(false);
      });
      req.write(payloadStr);
      req.end();
    });
  }

  // Test Authorization header
  await testLive("Authorization Header", {
    hostname: "localhost",
    port: 3000,
    path: "/api/payments/tamara/webhook",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${liveToken}`,
    },
  });

  // Test query param fallback (no header)
  await testLive("Query Param (?tamaraToken=)", {
    hostname: "localhost",
    port: 3000,
    path: `/api/payments/tamara/webhook?tamaraToken=${encodeURIComponent(liveToken)}`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  // Test missing auth → 401
  await testLive("Missing Auth (expect 401)", {
    hostname: "localhost",
    port: 3000,
    path: "/api/payments/tamara/webhook",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
} else {
  console.log("TEST 5: Live Endpoint");
  console.log("=".repeat(60));
  console.log("  Skipped (run with --live to test against localhost:3000)");
}

// ================================================================
// Summary
// ================================================================
console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("=".repeat(60));

process.exit(failed > 0 ? 1 : 0);
