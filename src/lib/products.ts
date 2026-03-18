import { prisma } from "./prisma";

export const revalidate = 60; // Revalidate every 60 seconds

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

export async function getProducts() {
  try {
    const dbProducts = await prisma.product.findMany({
      where: {
        active: true,
      },
      include: {
        brand: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const products = dbProducts.map((p: any) => {
      const regularPrice = p.priceCents / 100;
      const salePrice = p.discountCents ? (p.priceCents - p.discountCents) / 100 : null;
      
      const mainImage = isValidImageUrl(p.mainImage) ? p.mainImage : null;
      const galleryImages = (p.images || []).filter(isValidImageUrl);

      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        features: p.features || [],
        images: galleryImages,
        mainImage: mainImage,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        priceCents: p.discountCents ? (p.priceCents - p.discountCents) : p.priceCents,
        regularPriceCents: p.priceCents,
        salePriceCents: p.discountCents ? (p.priceCents - p.discountCents) : null,
        currency: p.currency.toUpperCase(),
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        brand: p.brand ? { name: p.brand.name } : null,
        category: p.category ? { name: p.category.name } : null,
      };
    });

    return products;
  } catch (error) {
    console.error("Prisma Products Fetch Error:", error);
    return [];
  }
}

export async function getProduct(id: string) {
  try {
    const p = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!p) return null;

    const mainImage = isValidImageUrl(p.mainImage) ? (p.mainImage as string) : null;
    const galleryImages = (p.images || []).filter(isValidImageUrl) as string[];

    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      features: p.features || [],
      images: galleryImages,
      mainImage: mainImage,
      stockQuantity: p.stockQuantity || 0,
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      priceCents: p.discountCents ? (p.priceCents - p.discountCents) : p.priceCents,
      regularPriceCents: p.priceCents,
      salePriceCents: p.discountCents ? (p.priceCents - p.discountCents) : null,
      currency: p.currency.toUpperCase(),
      active: p.active,
      hot: p.hot,
      trending: p.trending,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.category ? { name: p.category.name } : null,
      related_ids: [],
    };
  } catch (error) {
    console.error("Prisma Product Fetch Error:", error);
    return null;
  }
}

