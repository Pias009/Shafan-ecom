import ProductsClient from "./ProductsClient";
import { getProducts } from "@/lib/products";
import { getStoreCode } from "@/lib/server/store-utils";
import { Suspense } from "react";

export const revalidate = 60; // ISR cache for native server rendering

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string }>;
}) {
  const storeCode = await getStoreCode();
  const products = await getProducts(storeCode);
  const params = await searchParams;
  const category = params.category;
  const brand = params.brand;
  
  // Transform data for UI compatibility on the server
  const transformed = products.map((p: any) => ({
    ...p,
    price: p.regularPriceCents / 100,
    discountPrice: p.salePriceCents ? p.salePriceCents / 100 : undefined,
    brandName: p.brand?.name || "Generic",
    categoryName: p.category?.name || "General",
    imageUrl: p.mainImage || "/placeholder-product.png",
    images: p.images || []
  }));

  return <ProductsClient initialProducts={transformed} category={category} brand={brand} />;
}
