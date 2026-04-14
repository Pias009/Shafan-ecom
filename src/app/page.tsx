import HomeClient from "./HomeClient";
import { getProducts, getNewArrivals } from "@/lib/products";
import { getStoreCode } from "@/lib/server/store-utils";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";

export const revalidate = 60; // Cache for 60 seconds

export default async function HomePage() {
  const storeCode = await getStoreCode();
  
  // Get all products - filtering happens on client side to avoid hydration mismatches
  const [products, newArrivals] = await Promise.all([
    getProducts(storeCode),
    getNewArrivals(storeCode)
  ]);
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    }>
      <HomeClient initialProducts={products} newArrivals={newArrivals} />
    </Suspense>
  );
}
