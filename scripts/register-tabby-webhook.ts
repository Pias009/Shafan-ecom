/**
 * Register (or list) the Tabby webhook for payment status notifications.
 *
 * Tabby registers webhooks per `merchant_code` + secret-key pair (max 4 each).
 * The registered webhook is authenticated with a custom header that our handler
 * (`/api/payments/tabby/webhook`) checks against TABBY_WEBHOOK_SECRET.
 *
 * Usage:
 *   npx tsx scripts/register-tabby-webhook.ts list
 *   npx tsx scripts/register-tabby-webhook.ts register [https://your-domain.com]
 *
 * Required env: TABBY_API_KEY (secret key), TABBY_MERCHANT_CODE, TABBY_WEBHOOK_SECRET
 */

const API_BASE = process.env.TABBY_API_BASE || "https://api.tabby.ai";
const SECRET_KEY = (process.env.TABBY_API_KEY || "").trim();
const MERCHANT_CODE = (process.env.TABBY_MERCHANT_CODE || "").trim();
const WEBHOOK_SECRET = (process.env.TABBY_WEBHOOK_SECRET || "").trim();

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SECRET_KEY}`,
    "X-Merchant-Code": MERCHANT_CODE,
  };
}

async function list() {
  const res = await fetch(`${API_BASE}/api/v1/webhooks`, { headers: authHeaders() });
  const text = await res.text();
  console.log(`GET /api/v1/webhooks -> ${res.status}`);
  console.log(text);
}

async function register(baseUrl: string) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/payments/tabby/webhook`;
  const body = {
    url,
    is_test: process.env.NODE_ENV !== "production",
    // Tabby will send this header on every webhook call; our handler validates it.
    header: { title: "X-Tabby-Secret", value: WEBHOOK_SECRET },
  };

  const res = await fetch(`${API_BASE}/api/v1/webhooks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`POST /api/v1/webhooks (${url}) -> ${res.status}`);
  console.log(text);
  if (!res.ok) process.exitCode = 1;
}

async function main() {
  if (!SECRET_KEY || !MERCHANT_CODE) {
    console.error("Missing TABBY_API_KEY or TABBY_MERCHANT_CODE in the environment.");
    process.exit(1);
  }

  const [cmd, arg] = process.argv.slice(2);

  if (cmd === "list") {
    await list();
    return;
  }

  if (cmd === "register") {
    const baseUrl =
      arg ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      console.error("Provide a base URL, e.g. npx tsx scripts/register-tabby-webhook.ts register https://www.shanfaglobal.com");
      process.exit(1);
    }
    if (!WEBHOOK_SECRET) {
      console.warn("TABBY_WEBHOOK_SECRET is empty — the webhook will be registered without header auth.");
    }
    await register(baseUrl);
    return;
  }

  console.log("Usage:\n  npx tsx scripts/register-tabby-webhook.ts list\n  npx tsx scripts/register-tabby-webhook.ts register [https://your-domain.com]");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
