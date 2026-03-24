import HomeClient from "./HomeClient";
import { getProducts, getNewArrivals } from "@/lib/products";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";

export const dynamic = 'force-dynamic'; // Force dynamic rendering due to useSearchParams
export const revalidate = 0; // No ISR when dynamic

export default async function HomePage() {
  const [products, newArrivals] = await Promise.all([
    getProducts(),
    getNewArrivals()
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
