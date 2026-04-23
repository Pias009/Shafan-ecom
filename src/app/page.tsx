import HomeClient from "./HomeClient";
import { getProducts, getNewArrivals, getFlashSales, getTrendingProducts } from "@/lib/products";
import { getStoreCode } from "@/lib/server/store-utils";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";

export const revalidate = 60;

export default async function HomePage() {
  const storeCode = await getStoreCode();
  
  const [products, newArrivals, flashSales, trending] = await Promise.all([
    getProducts(storeCode),
    getNewArrivals(storeCode),
    getFlashSales(storeCode),
    getTrendingProducts(storeCode)
  ]);
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    }>
      <HomeClient initialProducts={products} newArrivals={newArrivals} flashSales={flashSales} hot={trending} />
    </Suspense>
  );
}
