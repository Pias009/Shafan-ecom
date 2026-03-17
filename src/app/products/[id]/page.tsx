import { getProduct, getProducts } from "@/lib/products";
import ProductPageClient from "./ProductPageClient";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Fetch recommendations (other products in the same category)
  const allProducts = await getProducts();
  const recommendations = allProducts
    .filter((p: any) => p.id !== product.id && p.category?.name === product.category?.name)
    .slice(0, 4);

  return <ProductPageClient product={product} recommendations={recommendations} />;
}
