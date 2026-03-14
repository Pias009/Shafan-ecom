import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const woocommerceUrl = (process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || "").replace(/\/$/, "");
const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

export const wooApi = new WooCommerceRestApi({
  url: woocommerceUrl,
  consumerKey: consumerKey,
  consumerSecret: consumerSecret,
  version: "wc/v3",
  queryStringAuth: true,
  axiosConfig: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
});

export default wooApi;
