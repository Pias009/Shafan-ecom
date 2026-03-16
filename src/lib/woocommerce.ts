import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from "https";
import http from "http";

const woocommerceUrl = (process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || "").replace(/\/$/, "");
const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

// TRICK: Use keep-alive agents to prevent new TLS handshakes on every request (saves ~500ms-1s per call)
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

export const wooApi = new WooCommerceRestApi({
  url: woocommerceUrl,
  consumerKey: consumerKey,
  consumerSecret: consumerSecret,
  version: "wc/v3",
  queryStringAuth: true,
  axiosConfig: {
    timeout: 25000, 
    httpAgent,
    httpsAgent,
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  }
});

export default wooApi;

