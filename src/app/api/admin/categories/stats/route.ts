import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidPrice } from "@/lib/product-utils";

export async function GET(request: NextRequest) {
  try {
    // Get all products with their categories (admin view)
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        stockQuantity: true,
        price: true,
        countryPrices: {
          select: {
            price: true,
            active: true
          }
        },
        productCategories: {
          include: {
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Get active products that would show on user site
    const userVisibleProducts = allProducts.filter(p => {
      return p.active === true && hasValidPrice(p);
    });

    // Build category stats
    const categoryStats = new Map<string, { adminCount: number; userCount: number; hidden: number; products: string[] }>();

    // Count from all products (admin)
    allProducts.forEach(p => {
      p.productCategories.forEach(pc => {
        const catName = pc.category?.name;
        if (!catName) return;
        
        const existing = categoryStats.get(catName) || { adminCount: 0, userCount: 0, hidden: 0, products: [] };
        existing.adminCount += 1;
        existing.products.push(p.name);
        categoryStats.set(catName, existing);
      });
    });

    // Count from user visible products
    userVisibleProducts.forEach(p => {
      p.productCategories.forEach(pc => {
        const catName = pc.category?.name;
        if (!catName) return;
        
        const existing = categoryStats.get(catName);
        if (existing) {
          existing.userCount += 1;
        }
      });
    });

    // Calculate hidden (products that exist but are not showing to users)
    categoryStats.forEach((stats, catName) => {
      stats.hidden = stats.adminCount - stats.userCount;
    });

    // Sort by admin count descending
    const sortedCategories = Array.from(categoryStats.entries())
      .map(([name, stats]) => ({
        name,
        adminCount: stats.adminCount,
        userCount: stats.userCount,
        hidden: stats.hidden,
        productNames: stats.products
      }))
      .sort((a, b) => b.adminCount - a.adminCount);

    // Get products that are hidden (not visible to users but exist in admin)
    const hiddenProducts = allProducts.filter(p => {
      return !hasValidPrice(p) || p.active !== true;
    }).map(p => ({
      id: p.id,
      name: p.name,
      active: p.active,
      price: p.price,
      hasCountryPrices: p.countryPrices && p.countryPrices.length > 0,
      countryPricesValid: hasValidPrice(p),
      categories: p.productCategories.map(pc => pc.category?.name).filter(Boolean)
    }));

    return NextResponse.json({
      categories: sortedCategories,
      totalAdminProducts: allProducts.length,
      totalUserProducts: userVisibleProducts.length,
      hiddenProducts: hiddenProducts,
      summary: {
        totalCategories: sortedCategories.length,
        categoriesWithHidden: sortedCategories.filter(c => c.hidden > 0).length,
        totalHidden: hiddenProducts.length
      }
    });
  } catch (error) {
    console.error("Category stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category stats" },
      { status: 500 }
    );
  }
}