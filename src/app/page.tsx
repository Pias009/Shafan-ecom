import HomeClient from "./HomeClient";
import { getProducts } from "@/lib/products";

export const revalidate = 60; // ISR cache for native server rendering

export default async function HomePage() {
  const products = await getProducts();
  
  return <HomeClient initialProducts={products} />;
}
