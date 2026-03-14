import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const woocommerceUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || "";
const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

export const wooApi = new WooCommerceRestApi({
  url: woocommerceUrl,
  consumerKey: consumerKey,
  consumerSecret: consumerSecret,
  version: "wc/v3",
  queryStringAuth: true, // Force Basic Auth as query string to menghindari issue pada beberapa server
});

export default wooApi;
