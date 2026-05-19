const crypto = require('crypto');
const http = require('http');

// 1. Set your secret key from your .env file
// If your .env uses a different key, paste it here:
const NOTIFICATION_KEY = process.env.TAMARA_NOTIFICATION_TOKEN || "YOUR_TEST_NOTIFICATION_KEY"; 

// 2. The event payload we want to simulate
const payload = {
  order_reference_id: "test-order-12345",
  order_id: "tamara-checkout-id-9876",
  event_type: "order_approved",
  status: "approved"
};

const payloadString = JSON.stringify(payload);

// 3. Construct the JWT parts manually
const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
const jwtPayload = Buffer.from(payloadString).toString('base64url');
const dataToSign = `${header}.${jwtPayload}`;

// 4. Calculate the secure HMAC SHA-256 signature
const signature = crypto
  .createHmac('sha256', NOTIFICATION_KEY)
  .update(dataToSign)
  .digest('base64url');

const token = `${dataToSign}.${signature}`;

console.log("🔒 Generated Secure Token:", token);
console.log("🚀 Firing Webhook to http://localhost:3000/api/payments/tamara/notification...");

// 5. Fire the POST request to your local server
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/payments/tamara/notification',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`\n✅ Server Responded with Status: ${res.statusCode}`);
    console.log(`📦 Response Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Request Failed: ${e.message}`);
  console.error("Is your Next.js server running on port 3000?");
});

req.write(payloadString);
req.end();
