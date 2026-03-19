import HomeClient from "./HomeClient";
import { getProducts } from "@/lib/products";
import { Suspense } from "react";

export const revalidate = 60; // ISR cache for native server rendering

export default async function HomePage() {
  const products = await getProducts();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient initialProducts={products} />
    </Suspense>
  );
}
