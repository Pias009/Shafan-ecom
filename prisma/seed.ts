import { prisma } from "../src/lib/prisma";
import { MongoClient } from "mongodb";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

async function main() {
  console.log("Seeding database...");

  // Fix existing records with null timestamps using MongoDB native driver
  try {
    const mongoUrl = process.env.DATABASE_URL || "";
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db();
    
    const now = new Date();
    
    await db.collection("Category").updateMany(
      { createdAt: null },
      { $set: { createdAt: now, updatedAt: now } }
    );
    await db.collection("SubCategory").updateMany(
      { createdAt: null },
      { $set: { createdAt: now, updatedAt: now } }
    );
    await db.collection("SkinTone").updateMany(
      { createdAt: null },
      { $set: { createdAt: now, updatedAt: now } }
    );
    await db.collection("SkinConcern").updateMany(
      { createdAt: null },
      { $set: { createdAt: now, updatedAt: now } }
    );
    
    await client.close();
    console.log("Fixed null timestamps in existing records using MongoDB driver.");
  } catch (e) {
    console.log("Note: Could not fix timestamps with MongoDB driver, continuing...");
  }

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
      country: "UAE",
      approvedBySuperAdmin: true,
    },
    create: {
      email: masterAdminEmail,
      name: "Master Admin",
      passwordHash: masterAdminHashedPassword,
      role: "SUPERADMIN",
      country: "UAE",
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
      country: "UAE",
      approvedBySuperAdmin: true,
    },
    create: {
      email: adminEmail,
      name: "Demo Admin",
      passwordHash: adminHashedPassword,
      role: "ADMIN",
      country: "UAE",
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

  // 4. Create Main Categories with Sub-categories
  const mainCategories = [
    {
      name: "Skin Care",
      subCategories: [
        "Cleanser",
        "Mask & Scrub",
        "Toner",
        "Face Serum",
        "Cream",
        "Lotion",
        "Moisturizer",
        "Sunscreen",
        "Eye Care"
      ]
    },
    {
      name: "Body Care",
      subCategories: [
        "Body Cream & Lotion",
        "Body Wash",
        "Body Oil"
      ]
    },
    {
      name: "Hair Care",
      subCategories: [
        "Hair Serum",
        "Hair Oil",
        "Hair Shampoo",
        "Hair Conditioner",
        "Hair Mask"
      ]
    },
    {
      name: "Fragrances",
      subCategories: [
        "Fragrances for Men",
        "Fragrances for Women"
      ]
    }
  ];

  for (const cat of mainCategories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
    
    for (const subCatName of cat.subCategories) {
      await prisma.subCategory.upsert({
        where: { name: subCatName },
        update: {},
        create: { 
          name: subCatName,
          categoryId: category.id
        },
      });
    }
  }
  console.log("Categories and Sub-categories seeded.");

  // 5. Create Skin Tones
  const skinTones = [
    { name: "Oily Skin", hexColor: "#F5D0A9" },
    { name: "Dry Skin", hexColor: "#FFE4C4" },
    { name: "Normal Skin", hexColor: "#FFDBAC" },
    { name: "Combination", hexColor: "#E8C4A0" },
    { name: "Acne-prone Skin", hexColor: "#FFDAB9" },
    { name: "All type Skin", hexColor: "#D2B48C" }
  ];

  for (const tone of skinTones) {
    await prisma.skinTone.upsert({
      where: { name: tone.name },
      update: { hexColor: tone.hexColor },
      create: { name: tone.name, hexColor: tone.hexColor },
    });
  }
  console.log("Skin tones seeded.");

  // 6. Create Skin Concerns
  const skinConcerns = [
    { name: "Acne", description: "Treat and prevent acne breakouts" },
    { name: "Acne Scar", description: "Reduce appearance of acne scars" },
    { name: "Anti Pores", description: "Minimize the appearance of pores" },
    { name: "Anti Wrinkles", description: "Reduce fine lines and wrinkles" },
    { name: "Anti Aging", description: "Fight signs of aging" },
    { name: "Brightening", description: "Achieve brighter, more radiant skin" },
    { name: "Dark Circles", description: "Reduce appearance of dark circles under eyes" },
    { name: "Dark Spot", description: "Fade dark spots and hyperpigmentation" },
    { name: "Melasma", description: "Treat melasma and uneven skin tone" },
    { name: "Pigmentation", description: "Address pigmentation issues" },
    { name: "Redness", description: "Calm and reduce skin redness" }
  ];

  for (const concern of skinConcerns) {
    await prisma.skinConcern.upsert({
      where: { name: concern.name },
      update: { description: concern.description },
      create: { name: concern.name, description: concern.description },
    });
  }
  console.log("Skin concerns seeded.");

  // 7. Create Brands
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

  // 9. Fetch created data for mapping
  const dbBrands = await prisma.brand.findMany();
  const dbCategories = await prisma.category.findMany();
  const dbSkinTones = await prisma.skinTone.findMany();
  const dbSkinConcerns = await prisma.skinConcern.findMany();

  const brandMap: Record<string, string> = {};
  dbBrands.forEach((b: any) => { brandMap[b.name] = b.id; });
  
  const catMap: Record<string, string> = {};
  dbCategories.forEach((c: any) => { 
    if (c.name && c.id) catMap[c.name] = c.id; 
  });
  
  const skinToneMap: Record<string, string> = {};
  dbSkinTones.forEach((s: any) => { skinToneMap[s.name] = s.id; });
  
  const skinConcernMap: Record<string, string> = {};
  dbSkinConcerns.forEach((s: any) => { skinConcernMap[s.name] = s.id; });

  // 10. Create Products with multiple categories
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
      categoryNames: ["Skin Care"],
      subCategoryName: "Cleanser",
      skinToneNames: ["All type Skin", "Combination"],
      skinConcernNames: ["Acne", "Brightening"],
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
      categoryNames: ["Skin Care"],
      subCategoryName: "Face Serum",
      skinToneNames: ["All type Skin"],
      skinConcernNames: ["Brightening", "Anti Aging", "Dark Spot"],
      hot: true,
    },
    {
      name: "Mint Cloud Mist",
      description: "Refresh on demand with an ultra-fine mist that sits like glass, not droplets.",
      features: ["Fine atomizer", "Cooling feel", "Makeup friendly"],
      priceCents: 1800,
      mainImage: "https://images.unsplash.com/photo-1612810436541-336f8fd55eb5?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1612810436541-336f8fd55eb5?auto=format&fit=crop&w=1200&q=80"],
      brandName: "NoirMint",
      categoryNames: ["Skin Care"],
      subCategoryName: "Toner",
      skinToneNames: ["All type Skin"],
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
      categoryNames: ["Hair Care"],
      subCategoryName: "Hair Shampoo",
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
      categoryNames: ["Hair Care"],
      subCategoryName: "Hair Conditioner",
    },
    {
      name: "Violet Night Eau",
      description: "A cool, modern fragrance with a transparent opening and deep, smooth dry-down.",
      features: ["Iris + cedar", "Cool amber", "Long wear"],
      priceCents: 5800,
      mainImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80"],
      brandName: "Violet Lab",
      categoryNames: ["Fragrances"],
      subCategoryName: "Fragrances for Women",
    },
  ];

  for (const p of products) {
    const { brandName, categoryNames, subCategoryName, skinToneNames, skinConcernNames, ...rest } = p;

    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    const categoryIds = categoryNames?.map((name: string) => catMap[name]).filter(Boolean) || [];
    const skinToneIds = skinToneNames?.map((name: string) => skinToneMap[name]).filter(Boolean) || [];
    const skinConcernIds = skinConcernNames?.map((name: string) => skinConcernMap[name]).filter(Boolean) || [];
    
    const subCategory = subCategoryName 
      ? await prisma.subCategory.findFirst({ where: { name: subCategoryName } })
      : null;

    const productData = {
      ...rest,
      brandId: brandMap[brandName] || null,
      subCategoryId: subCategory?.id || null,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
    };

    let product;
    if (existing) {
      // Clear existing relations first
      await prisma.productCategory.deleteMany({ where: { productId: existing.id } });
      await prisma.productSkinTone.deleteMany({ where: { productId: existing.id } });
      await prisma.productSkinConcern.deleteMany({ where: { productId: existing.id } });
      
      product = await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
    } else {
      try {
        product = await prisma.product.create({
          data: productData,
        });
      } catch (e) {
        console.log(`Warning: Could not create product "${p.name}", skipping...`);
        continue;
      }
    }

    // Create product categories
    if (categoryIds.length > 0) {
      await prisma.productCategory.deleteMany({ where: { productId: product.id } });
      await prisma.productCategory.createMany({
        data: categoryIds.map((catId: string) => ({
          productId: product.id,
          categoryId: catId
        }))
      });
    }

    // Create product skin tones
    if (skinToneIds.length > 0) {
      await prisma.productSkinTone.deleteMany({ where: { productId: product.id } });
      await prisma.productSkinTone.createMany({
        data: skinToneIds.map((toneId: string) => ({
          productId: product.id,
          skinToneId: toneId
        }))
      });
    }

    // Create product skin concerns
    if (skinConcernIds.length > 0) {
      await prisma.productSkinConcern.deleteMany({ where: { productId: product.id } });
      await prisma.productSkinConcern.createMany({
        data: skinConcernIds.map((concernId: string) => ({
          productId: product.id,
          skinConcernId: concernId
        }))
      });
    }
  }

  console.log("Products seeded with categories, skin tones, and skin concerns.");
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
