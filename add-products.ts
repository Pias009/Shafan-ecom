import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mongodb+srv://Shanfa:Shanha90@cluster0.4utvsjg.mongodb.net/shafan-ecommerce?retryWrites=true&w=majority",
    },
  },
});

function generateId(prefix: string): string {
  const chars = "0123456789abcdef";
  let id = prefix + "_";
  for (let i = 0; i < 22; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function main() {
  console.log("Adding sample products...");

  // Create a brand first
  const brandId = generateId("brand");
  const brand = await prisma.brand.create({
    data: {
      id: brandId,
      name: "Anua",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=200&q=80",
    },
  }).catch(() => prisma.brand.findFirst({ where: { name: "Anua" } }));

  // Create a category
  const catId = generateId("cat");
  const category = await prisma.category.create({
    data: {
      id: catId,
      name: "Skincare",
    },
  }).catch(() => prisma.category.findFirst({ where: { name: "Skincare" } }));

  // Create products
  const products = [
    {
      id: generateId("prod"),
      name: "Heartleaf 77% Toner",
      description: "A soothing toner with heartleaf extract that calms irritated skin and provides deep hydration.",
      shortDescription: "Calming toner for all skin types",
      priceCents: 2500,
      mainImage: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80",
      images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80"],
      features: ["Heartleaf extract", "77% fermented", "Soothing", "Hydrating"],
      active: true,
      hot: true,
      brandId: brand?.id || "",
    },
    {
      id: generateId("prod"),
      name: "Niacinamide 10% + Zinc 1% Serum",
      description: "A powerful serum that minimizes pores, balances oil, and brightens skin tone.",
      shortDescription: "Pore minimizing serum",
      priceCents: 1800,
      mainImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
      images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"],
      features: ["Niacinamide 10%", "Zinc 1%", "Pore care", "Oil control"],
      active: true,
      hot: true,
      brandId: brand?.id || "",
    },
    {
      id: generateId("prod"),
      name: "Moisturizing Foam Cleanser",
      description: "A gentle, low pH cleanser that removes impurities while maintaining skin moisture.",
      shortDescription: "Low pH gentle cleanser",
      priceCents: 2200,
      mainImage: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=800&q=80",
      images: ["https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=800&q=80"],
      features: ["Low pH formula", "Moisturizing", "Gentle", "Cleansing"],
      active: true,
      brandId: brand?.id || "",
    },
    {
      id: generateId("prod"),
      name: "Snake Plant Calming Gel",
      description: "A lightweight gel moisturizer with snake plant extract for sensitive skin.",
      shortDescription: "Calming gel for sensitive skin",
      priceCents: 3200,
      mainImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
      images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80"],
      features: ["Snake plant extract", "Calming", "Lightweight", "Sensitive skin"],
      active: true,
      trending: true,
      brandId: brand?.id || "",
    },
    {
      id: generateId("prod"),
      name: "Blue Vitamin C Serum",
      description: "A stabilized vitamin C serum that brightens and protects against free radicals.",
      shortDescription: "Brightening vitamin C serum",
      priceCents: 4500,
      mainImage: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
      images: ["https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80"],
      features: ["Vitamin C", "Brightening", "Antioxidant", "Protective"],
      active: true,
      hot: true,
      brandId: brand?.id || "",
    },
  ];

  for (const product of products) {
    try {
      await prisma.product.create({ data: product });
      console.log(`✅ Added: ${product.name}`);
    } catch (e) {
      console.log(`⚠️ Skipped: ${product.name} (may exist)`);
    }
  }

  console.log("\n🎉 Products added! Check the website now.");
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
