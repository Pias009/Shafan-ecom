import HomeClient from "./HomeClient";
import { getProducts } from "@/lib/products";
import { Suspense } from "react";

export const dynamic = 'force-dynamic'; // Force dynamic rendering due to useSearchParams
export const revalidate = 0; // No ISR when dynamic

export default async function HomePage() {
  const products = await getProducts();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient initialProducts={products} />
    </Suspense>
  );
}
