import { getOptimizedProduct } from "@/lib/optimized-products";
import { getProducts } from "@/lib/products";
import { getStoreCode } from "@/lib/server/store-utils";
import ProductPageClient from "./ProductPageClient";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeCode = await getStoreCode();
  
  // Get product with store-specific inventory check
  const product = await getOptimizedProduct(id, storeCode) as any;

  if (!product || !product.id) {
    // Product not found or not available in user's store
    notFound();
  }

  // Fetch recommendations filtered by store (other products in the same category)
  const storeProducts = await getProducts(storeCode);
  const recommendations = storeProducts
    .filter((p: any) => p.id !== product.id && p.category?.name === product.category?.name)
    .slice(0, 4);

  return <ProductPageClient product={product} recommendations={recommendations} />;
}
