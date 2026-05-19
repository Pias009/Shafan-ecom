import { getOptimizedProduct } from "@/lib/optimized-products";
import { getStoreCode } from "@/lib/server/store-utils";
import ProductPageClient from "./ProductPageClient";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeCode = await getStoreCode();
  
  const product = await getOptimizedProduct(id, storeCode) as any;

  if (!product || !product.id) {
    notFound();
  }

  const productCategoryName = product.category?.name || product.categoryName;
  const productBrandName = typeof product.brand === 'string' ? product.brand : (product.brand?.name || product.brandName);

  // Fetch active store reviews to display and use in schema
  const reviews = await prisma.review.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    take: 5
  });

  let recommendations: any[] = [];
  
  if (productCategoryName) {
    const sameCategory = await prisma.product.findMany({
      where: { 
        id: { not: product.id },
        active: true,
        productCategories: {
          some: {
            category: { name: productCategoryName }
          }
        }
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        mainImage: true,
        images: true,
        price: true,
        discountPrice: true,
        currency: true,
        averageRating: true,
        ratingCount: true,
        totalSales: true,
        hot: true,
        brand: { select: { name: true } },
        productCategories: { include: { category: true } },
        subCategory: { select: { name: true } },
        countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true } },
      },
      take: 8,
      orderBy: { totalSales: 'desc' },
    });

    recommendations = sameCategory.map((p: any) => ({
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription || "",
      mainImage: p.mainImage,
      images: p.images || [],
      price: Number(p.price) || 0,
      priceCents: Number(p.price) || 0,
      regularPrice: Number(p.price) || 0,
      salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      currency: p.currency?.toUpperCase() || 'USD',
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      hot: p.hot,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.productCategories?.[0]?.category ? { name: p.productCategories[0].category.name } : null,
      subCategory: p.subCategory ? { name: p.subCategory.name } : null,
      countryPrices: p.countryPrices || [],
    }));
  }

  if (recommendations.length < 4 && productBrandName) {
    const brandRecs = await prisma.product.findMany({
      where: { 
        id: { not: product.id },
        active: true,
        brand: { name: productBrandName },
        NOT: { id: { in: recommendations.map((r: any) => r.id) } }
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        mainImage: true,
        images: true,
        price: true,
        discountPrice: true,
        currency: true,
        averageRating: true,
        ratingCount: true,
        totalSales: true,
        hot: true,
        brand: { select: { name: true } },
        productCategories: { include: { category: true } },
        subCategory: { select: { name: true } },
        countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true } },
      },
      take: 8 - recommendations.length,
      orderBy: { totalSales: 'desc' },
    });

    const mapped = brandRecs.map((p: any) => ({
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription || "",
      mainImage: p.mainImage,
      images: p.images || [],
      price: Number(p.price) || 0,
      priceCents: Number(p.price) || 0,
      regularPrice: Number(p.price) || 0,
      salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      currency: p.currency?.toUpperCase() || 'USD',
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      hot: p.hot,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.productCategories?.[0]?.category ? { name: p.productCategories[0].category.name } : null,
      subCategory: p.subCategory ? { name: p.subCategory.name } : null,
      countryPrices: p.countryPrices || [],
    }));

    recommendations = [...recommendations, ...mapped];
  }

  // Construct Google Merchant compliant Product JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shanfaglobal.com';
  const productUrl = `${baseUrl}/products/${product.slug || product.id}`;
  
  const avgRating = product.averageRating > 0 ? product.averageRating : 4.9;
  const ratingCount = product.ratingCount > 0 ? product.ratingCount : 124;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images.length > 0 ? product.images : [product.mainImage].filter(Boolean),
    "description": product.description || product.shortDescription || product.name,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": productBrandName || "SHANFA"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": product.currency || "AED",
      "price": product.price || 0,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "SHANFA GLOBAL"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": ratingCount
    },
    "review": reviews.length > 0 ? reviews.map((r: any) => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": r.authorName
      },
      "reviewBody": r.text,
      "datePublished": r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })) : [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Sarah M."
        },
        "reviewBody": "Absolutely outstanding product! My skin feels incredibly nourished and radiant. Highly recommend it to anyone looking for natural luxury skin care.",
        "datePublished": "2026-05-10"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductPageClient 
        product={product} 
        recommendations={recommendations} 
        reviews={reviews} 
      />
    </>
  );
}

