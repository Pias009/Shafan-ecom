import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting cleanup and sync...");

  // 1. BRANDS: Delete specified brands
  const brandsToDelete = [
    "AquaGlass",
    "Frost & Co",
    "Glow Forge",
    "Kuwait Heritage",
    "NoirMint",
    "SkyPerl",
    "UAE Local",
    "Violet Lab",
  ];

  for (const brandName of brandsToDelete) {
    const result = await prisma.brand.deleteMany({
      where: { name: brandName },
    });
    if (result.count > 0) {
      console.log(`Deleted brand: ${brandName}`);
    }
  }

  // Add Color Wow brand
  await prisma.brand.upsert({
    where: { name: "Color Wow" },
    update: {},
    create: { name: "Color Wow" },
  });
  console.log("Added brand: Color Wow");

  // 2. CATEGORIES: Delete specified categories
  const categoriesToDelete = [
    "Beverages",
    "Food",
    "fgfg",
  ];

  for (const catName of categoriesToDelete) {
    const result = await prisma.category.deleteMany({
      where: { name: catName },
    });
    if (result.count > 0) {
      console.log(`Deleted category: ${catName}`);
      // Also delete associated subcategories
      await prisma.subCategory.deleteMany({
        where: { category: { name: catName } },
      });
    }
  }

  // Get all category names to find duplicates (keeping first one)
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const nameCount: Record<string, string[]> = {};
  for (const cat of allCategories) {
    if (!nameCount[cat.name]) {
      nameCount[cat.name] = [];
    }
    nameCount[cat.name].push(cat.id);
  }

  // Delete duplicate categories (keep first entry)
  const duplicatesToDelete: string[] = [];
  for (const name of Object.keys(nameCount)) {
    if (nameCount[name].length > 1) {
      const _keepId = nameCount[name][0];
      const deleteIds = nameCount[name].slice(1);
      duplicatesToDelete.push(...deleteIds);
      console.log(`Found duplicate category: ${name} (IDs to delete: ${deleteIds.join(", ")})`);
    }
  }

  for (const id of duplicatesToDelete) {
    await prisma.category.delete({ where: { id } });
  }

  // Add Makeup category
  const makeupCategory = await prisma.category.upsert({
    where: { name: "Makeup" },
    update: {},
    create: { name: "Makeup" },
  });
  console.log("Added category: Makeup");

  // 3. SUBCATEGORIES for Skincare
  const skincareSubcategories = [
    "Supplements",
    "Routine",
    "Lip Care",
    "Hand Care",
    "Foot Care",
    "Baby Care",
  ];

  const skincareCategory = await prisma.category.findUnique({
    where: { name: "Skin Care" },
  });

  if (skincareCategory) {
    for (const subName of skincareSubcategories) {
      await prisma.subCategory.upsert({
        where: { name: subName },
        update: { categoryId: skincareCategory.id },
        create: { name: subName, categoryId: skincareCategory.id },
      });
      console.log(`Added skincare subcategory: ${subName}`);
    }
  }

  // 4. SUBCATEGORIES for Makeup
  const makeupSubcategories = [
    "Makeup Brushes",
    "Highlighter",
    "Foundation",
    "Loose Setting Powder",
    "Pressed Powder",
    "Concealer",
    "Eyebrow Pencil",
    "Mascara",
    "Lipstick",
  ];

  for (const subName of makeupSubcategories) {
    await prisma.subCategory.upsert({
      where: { name: subName },
      update: { categoryId: makeupCategory.id },
      create: { name: subName, categoryId: makeupCategory.id },
    });
    console.log(`Added makeup subcategory: ${subName}`);
  }

  // 5. SKIN TONES: Add Sensitive Skin
  await prisma.skinTone.upsert({
    where: { name: "Sensitive Skin" },
    update: {},
    create: { name: "Sensitive Skin" },
  });
  console.log("Added skin tone: Sensitive Skin");

  // 6. SKIN CONCERNS: Add new concerns
  const newSkinConcerns = [
    { name: "Blackheads", description: "Clear and prevent blackheads" },
    { name: "Dull Skin", description: "Restore radiance and glow" },
    { name: "Sun Damage", description: "Repair sun-damaged skin" },
    { name: "Whiteheads", description: "Treat and prevent whiteheads" },
  ];

  for (const concern of newSkinConcerns) {
    await prisma.skinConcern.upsert({
      where: { name: concern.name },
      update: { description: concern.description },
      create: { name: concern.name, description: concern.description },
    });
    console.log(`Added skin concern: ${concern.name}`);
  }

console.log("Cleanup and sync completed!");

  // 7. Clean up category duplicates (case variations)
  const categoryDeletions = [
    { keep: "Skin Care", delete: "Skincare" },
    { keep: "Hair Care", delete: "Haircare" },
    { keep: "Fragrances", delete: "Fragrance" },
  ];

  for (const { keep, delete: delName } of categoryDeletions) {
    const keepCat = await prisma.category.findUnique({ where: { name: keep } });
    const delCat = await prisma.category.findUnique({ where: { name: delName } });
    if (keepCat && delCat) {
      await prisma.subCategory.updateMany({
        where: { categoryId: delCat.id },
        data: { categoryId: keepCat.id },
      });
      await prisma.category.delete({ where: { id: delCat.id } });
      console.log(`Merged "${delName}" into "${keep}"`);
    }
  }

  console.log("Final cleanup completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });