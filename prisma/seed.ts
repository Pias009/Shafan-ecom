import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin User
  const adminEmail = "admin@shafan.com";
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: "Demo Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Admin user created/updated: ${admin.email}`);

  // Create Normal User
  const userEmail = "user@shafan.com";
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      passwordHash: hashedPassword,
      role: "USER",
    },
    create: {
      email: userEmail,
      name: "Demo User",
      passwordHash: hashedPassword,
      role: "USER",
    },
  });
  console.log(`Normal user created/updated: ${user.email}`);

  // 2. Create Categories
  const categories = [
    { name: "Skincare" },
    { name: "Haircare" },
    { name: "Fragrance" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log("Categories seeded.");

  // 3. Create Brands
  const brands = [
    { name: "Frost & Co" },
    { name: "AquaGlass" },
    { name: "NoirMint" },
    { name: "SkyPearl" },
    { name: "Violet Lab" },
    { name: "Glow Forge" },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }
  console.log("Brands seeded.");

  // 5. Create a sample Banner(s)
  const banners = [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-3f9d1bdb3e6f?auto=format&fit=crop&w=1200&q=80",
      title: "Spring Sale",
      link: "/brands",
      active: true,
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
      title: "New Arrivals",
      link: "/products",
      active: true,
    },
  ];

  for (const b of banners) {
    await (prisma as any).banner.upsert({
      where: { imageUrl: b.imageUrl },
      update: { title: b.title, link: b.link, active: b.active },
      create: b,
    });
  }
  console.log("Banners seeded.");

  // 5. Audit log seed (sample)
  try {
    const adminForLog = admin;
    const seedLog = await (prisma as any).auditLog.create({
      data: {
        action: "SEED",
        actorId: adminForLog.id,
        subjectId: adminForLog.id,
        details: "Initial seed of admin data and banners",
      },
    });
    console.log(`Audit log seeded: ${seedLog?.id}`);
  } catch {
    console.log("AuditLog model not yet available in Prisma client. Skipping seed.");
  }

  // 4. Fetch created brands and categories for mapping
  const dbBrands = await prisma.brand.findMany();
  const dbCategories = await prisma.category.findMany();

  const brandMap = Object.fromEntries(dbBrands.map((b: {name: string, id: string}) => [b.name, b.id]));
  const catMap = Object.fromEntries(dbCategories.map((c: {name: string, id: string}) => [c.name, c.id]));

  // 5. Create Products
  const products = [
    {
      name: "Icy Gel Cleanser",
      description: "A cooling cleanser built for daily use. Leaves skin clean and comfortable with a glassy finish.",
      features: ["Gentle surfactants", "No fragrance", "pH-balanced"],
      priceCents: 2400,
      discountCents: 1900,
      mainImage: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=1200&q=80",
      stockQuantity: 32,
      images: ["https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=1200&q=80"],
      brandName: "Frost & Co",
      categoryName: "Skincare",
      hot: true,
      trending: true,
    },
    {
      name: "Glass Skin Serum",
      description: "A lightweight, high-slip serum for a visible glow and soft-focus finish.",
      features: ["Hyaluronic complex", "Niacinamide", "Fast absorption"],
      priceCents: 3200,
      mainImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=80",
      stockQuantity: 28,
      images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=80"],
      brandName: "AquaGlass",
      categoryName: "Skincare",
      hot: true,
      trending: false,
    },
    {
      name: "Mint Cloud Mist",
      description: "Refresh on demand with an ultra-fine mist that sits like glass, not droplets.",
      features: ["Fine atomizer", "Cooling feel", "Makeup friendly"],
      priceCents: 1800,
      mainImage: "https://images.unsplash.com/photo-1612810436541-336f8fd55eb5?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1612810436541-336f8fd55eb5?auto=format&fit=crop&w=1200&q=80"],
      brandName: "NoirMint",
      categoryName: "Skincare",
    },
    {
      name: "Silk Glass Shampoo",
      description: "A modern shampoo for shine without heaviness—built for daily routines.",
      features: ["Low-foam cleanse", "Softens", "Color safe"],
      priceCents: 2800,
      discountCents: 2200,
      mainImage: "https://images.unsplash.com/photo-1611930021866-9f6bf2d2d4a1?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1611930021866-9f6bf2d2d4a1?auto=format&fit=crop&w=1200&q=80"],
      brandName: "Glow Forge",
      categoryName: "Haircare",
      hot: true,
    },
    {
      name: "Mirror Gloss Conditioner",
      description: "Detangles fast and leaves a reflective shine with a clean rinse.",
      features: ["Slip + detangle", "Silicone-smart", "Fresh finish"],
      priceCents: 3000,
      mainImage: "https://images.unsplash.com/photo-1620916566393-7a19f78146ee?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1620916566393-7a19f78146ee?auto=format&fit=crop&w=1200&q=80"],
      brandName: "SkyPearl",
      categoryName: "Haircare",
    },
    {
      name: "Violet Night Eau",
      description: "A cool, modern fragrance with a transparent opening and deep, smooth dry-down.",
      features: ["Iris + cedar", "Cool amber", "Long wear"],
      priceCents: 5800,
      mainImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80"],
      brandName: "Violet Lab",
      categoryName: "Fragrance",
    },
  ];

  for (const p of products) {
    const { brandName, categoryName, ...rest } = p;

    // Manually check by name
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
       await prisma.product.update({
         where: { id: existing.id },
         data: {
           ...rest,
           brandId: brandMap[brandName],
           categoryId: catMap[categoryName],
         }
       });
    } else {
       await prisma.product.create({
         data: {
           ...rest,
           brandId: brandMap[brandName],
           categoryId: catMap[categoryName],
         }
       });
    }
  }

  console.log("Products seeded.");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
