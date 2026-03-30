import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

async function main() {
  console.log("Seeding database...");

  // 1. Create Master Admin User (from environment variables or defaults)
  const masterAdminEmail = process.env.DEMO_SUPERADMIN_EMAIL || "superadmin@example.com";
  const masterAdminPassword = process.env.DEMO_SUPERADMIN_PASSWORD || "superadmin123";
  const masterAdminHashedPassword = await bcrypt.hash(masterAdminPassword, 10);

  const masterAdmin = await prisma.user.upsert({
    where: { email: masterAdminEmail },
    update: {
      passwordHash: masterAdminHashedPassword,
      role: "SUPERADMIN",
      name: "Master Admin",
      approvedBySuperAdmin: true, // Master admin is pre-approved
    },
    create: {
      email: masterAdminEmail,
      name: "Master Admin",
      passwordHash: masterAdminHashedPassword,
      role: "SUPERADMIN",
      approvedBySuperAdmin: true,
    },
  });
  console.log(`Master admin user created/updated: ${masterAdmin.email}`);

  // 2. Create Regular Admin User (from environment variables or defaults)
  const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin123";
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHashedPassword,
      role: "ADMIN",
      approvedBySuperAdmin: true, // Demo admin is pre-approved
    },
    create: {
      email: adminEmail,
      name: "Demo Admin",
      passwordHash: adminHashedPassword,
      role: "ADMIN",
      approvedBySuperAdmin: true,
    },
  });
  console.log(`Admin user created/updated: ${admin.email}`);

  // 3. Create Kuwait Admin User (store-based admin)
  const kuwaitAdminEmail = process.env.KUWAIT_ADMIN_EMAIL || "kuwait-admin@example.com";
  const kuwaitAdminPassword = process.env.KUWAIT_ADMIN_PASSWORD || "demoadmin";
  const kuwaitAdminHashedPassword = await bcrypt.hash(kuwaitAdminPassword, 10);

  const kuwaitAdmin = await prisma.user.upsert({
    where: { email: kuwaitAdminEmail },
    update: {
      passwordHash: kuwaitAdminHashedPassword,
      role: "ADMIN",
      country: "Kuwait",
      approvedBySuperAdmin: true,
    },
    create: {
      email: kuwaitAdminEmail,
      name: "Kuwait Admin",
      passwordHash: kuwaitAdminHashedPassword,
      role: "ADMIN",
      country: "Kuwait",
      approvedBySuperAdmin: true,
    },
  });
  console.log(`Kuwait admin user created/updated: ${kuwaitAdmin.email}`);

  // Create Normal User
  const userEmail = "user@shafan.com";
  const userPassword = "User@Shafan2024";
  const userHashedPassword = await bcrypt.hash(userPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      passwordHash: userHashedPassword,
      role: "USER",
    },
    create: {
      email: userEmail,
      name: "Demo User",
      passwordHash: userHashedPassword,
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
    { name: "Anua" },
    { name: "Axis-Y" },
    { name: "Beauty of Jason" },
    { name: "Celimax" },
    { name: "Cerave" },
    { name: "CosRx" },
    { name: "Dr.Althea" },
    { name: "Eucerin" },
    { name: "Embryolisse" },
    { name: "I am from" },
    { name: "K18" },
    { name: "Kiehl's" },
    { name: "Ksecret- Seoul 1988" },
    { name: "La Roche Posay" },
    { name: "Millie" },
    { name: "Medicube" },
    { name: "PanOxyl" },
    { name: "paula's choice" },
    { name: "Purito Seoul" },
    { name: "Skin 1004" },
    { name: "Some by mi" },
    { name: "The Ordinary" },
    { name: "Timeless" },
    // Keep existing demo brands for backward compatibility
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
        "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=1200",
      title: "Spring Sale",
      link: "/brands",
      active: true,
    },
    {
      imageUrl:
        "https://images.pexels.com/photos/3735641/pexels-photo-3735641.jpeg?auto=compress&cs=tinysrgb&w=1200",
      title: "New Arrivals",
      link: "/products",
      active: true,
    },
  ];

  for (const b of banners) {
    await prisma.enhancedOfferBanner.upsert({
      where: { imageUrl: b.imageUrl },
      update: { title: b.title, link: b.link, active: b.active },
      create: { ...b },
    });
  }
  console.log("Banners seeded.");
  // 6. Create SUPERADMIN (verification flow starts here)
  const superAdminEmail = process.env.DEMO_SUPERADMIN_EMAIL || "superadmin@example.com";
  const rawSuperPwd = process.env.DEMO_SUPERADMIN_PASSWORD || "superadmin123";
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24*60*60*1000);
  const hashedSuper = await bcrypt.hash(rawSuperPwd, 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { passwordHash: hashedSuper, role: "SUPERADMIN" },
    create: { email: superAdminEmail, name: "Super Admin", passwordHash: hashedSuper, role: "SUPERADMIN" },
  });
  console.log(`Super Admin prepared: ${superAdmin.email} (verification required)`);

  // 5. Audit log seed (sample)
  try {
    const adminForLog = admin;
    const seedLog = await prisma.auditLog.create({
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
