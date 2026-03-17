import ProductsClient from "./ProductsClient";
import { getProducts } from "@/lib/products";

export const revalidate = 60; // ISR cache for native server rendering

export default async function ProductsPage() {
  const products = await getProducts();
  
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

  return <ProductsClient initialProducts={transformed} />;
}
