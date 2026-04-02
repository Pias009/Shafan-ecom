import { prisma } from "@/lib/prisma";

async function seedDiscounts() {
  console.log("🌱 Seeding test discounts...");

  try {
    // Get first 5 products
    const products = await (prisma as any).product.findMany({
      take: 5,
      select: { id: true, name: true, sku: true },
    });

    if (products.length === 0) {
      console.log("❌ No products found. Create products first.");
      return;
    }

    // Create a 25% OFF discount for first product
    const discount1 = await (prisma as any).discount.create({
      data: {
        code: "SAVE25",
        name: "Save 25% on Selected Items",
        description: "Get 25% off on premium products - Limited Time Offer",
        discountType: "PERCENTAGE",
        value: 25,
        applyToAll: false,
        countries: ["AE", "KW", "BH", "SA", "OM", "QA"],
        status: "ACTIVE",
        active: true,
        publishedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxUses: null,
        minimumOrderValue: 0,
        createdBy: "seeder@example.com",
      },
    });

    // Link first product to discount
    await (prisma as any).productDiscount.create({
      data: {
        productId: products[0].id,
        discountId: discount1.id,
      },
    });

    console.log(`✅ Created discount: ${discount1.code} (25% OFF) for ${products[0].name}`);

    // Create a 50 AED FIXED discount for second product
    const discount2 = await (prisma as any).discount.create({
      data: {
        code: "SAVE50AED",
        name: "Save 50 AED",
        description: "Flat 50 AED discount on purchases",
        discountType: "FIXED_AMOUNT",
        value: 5000, // 50 AED in cents
        applyToAll: false,
        countries: ["AE"],
        status: "ACTIVE",
        active: true,
        publishedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUses: 100,
        minimumOrderValue: 10000, // 100 AED minimum
        createdBy: "seeder@example.com",
      },
    });

    await (prisma as any).productDiscount.create({
      data: {
        productId: products[1].id,
        discountId: discount2.id,
      },
    });

    console.log(`✅ Created discount: ${discount2.code} (50 AED OFF) for ${products[1].name}`);

    // Create FREE SHIPPING discount for third product
    const discount3 = await (prisma as any).discount.create({
      data: {
        code: "SHIPFREE",
        name: "Free Shipping Worldwide",
        description: "Get free shipping on this item",
        discountType: "FREE_SHIPPING",
        value: 0,
        applyToAll: false,
        countries: ["AE", "KW", "BH", "SA", "OM", "QA"],
        status: "ACTIVE",
        active: true,
        publishedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUses: null,
        minimumOrderValue: 0,
        createdBy: "seeder@example.com",
      },
    });

    await (prisma as any).productDiscount.create({
      data: {
        productId: products[2].id,
        discountId: discount3.id,
      },
    });

    console.log(`✅ Created discount: ${discount3.code} (FREE SHIPPING) for ${products[2].name}`);

    // Create a 35% OFF discount for fourth and fifth products
    const discount4 = await (prisma as any).discount.create({
      data: {
        code: "MEGA35",
        name: "Mega Sale - 35% Off",
        description: "Biggest sale of the month - 35% off selected items",
        discountType: "PERCENTAGE",
        value: 35,
        applyToAll: false,
        countries: ["AE", "KW", "BH", "SA", "OM", "QA"],
        status: "ACTIVE",
        active: true,
        publishedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        maxUses: 500,
        minimumOrderValue: 5000, // 50 AED minimum
        createdBy: "seeder@example.com",
      },
    });

    await (prisma as any).productDiscount.create({
      data: {
        productId: products[3].id,
        discountId: discount4.id,
      },
    });

    await (prisma as any).productDiscount.create({
      data: {
        productId: products[4].id,
        discountId: discount4.id,
      },
    });

    console.log(
      `✅ Created discount: ${discount4.code} (35% OFF) for ${products[3].name} and ${products[4].name}`
    );

    console.log("✅ Test discounts seeded successfully!");
    console.log("\n📋 Test Codes You Can Use:");
    console.log("  - SAVE25 (25% OFF)");
    console.log("  - SAVE50AED (50 AED OFF - UAE only, min 100 AED)");
    console.log("  - SHIPFREE (FREE SHIPPING)");
    console.log("  - MEGA35 (35% OFF - 7 days only)");
  } catch (error) {
    console.error("❌ Error seeding discounts:", error);
    throw error;
  }
}

seedDiscounts()
  .then(() => {
    console.log("\n🎉 Discount seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
