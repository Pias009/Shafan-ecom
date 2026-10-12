import { revalidatePath } from "next/cache";
import { bustHomepageCache } from "@/lib/products";

/**
 * Refresh every storefront page that shows admin-managed offers or banners.
 * /offers is cached for 10 minutes, so without this a deleted banner/discount
 * keeps showing there until the cache expires.
 */
export function revalidateOfferSurfaces() {
  bustHomepageCache();
  revalidatePath("/");
  revalidatePath("/offers");
}
