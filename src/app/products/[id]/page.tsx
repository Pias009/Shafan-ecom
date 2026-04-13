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

  // Fetch recommendations filtered by store (get more products for better recommendations)
  const storeProducts = await getProducts(storeCode, 1, 500);
  
  // Get category name - handle different structures from getOptimizedProduct vs getProducts
  const productCategoryName = product.category?.name || product.categoryName;
  const productBrandName = typeof product.brand === 'string' ? product.brand : (product.brand?.name || product.brandName);
  
  // First: same category, then: same brand if needed
  let recommendations = storeProducts
    .filter((p: any) => p.id !== product.id && p.categoryName === productCategoryName)
    .slice(0, 8);
  
  // If not enough, add from same brand
  if (recommendations.length < 4) {
    const brandRecs = storeProducts
      .filter((p: any) => 
        p.id !== product.id && 
        !recommendations.find((r: any) => r.id === p.id) &&
        p.brandName === productBrandName
      )
      .slice(0, 8 - recommendations.length);
    recommendations = [...recommendations, ...brandRecs];
  }

  return <ProductPageClient product={product} recommendations={recommendations} />;
}
