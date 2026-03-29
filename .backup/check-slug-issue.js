#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSlugIssue() {
  console.log('Checking for products with null or duplicate slugs...\n');
  
  try {
    // Check total number of products
    const totalProducts = await prisma.product.count();
    console.log(`Total products in database: ${totalProducts}`);
    
    // Check products with null slugs
    const nullSlugProducts = await prisma.product.findMany({
      where: { slug: null },
      select: { id: true, name: true, slug: true, createdAt: true }
    });
    
    console.log(`\nProducts with null slugs: ${nullSlugProducts.length}`);
    nullSlugProducts.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}) created: ${p.createdAt}`);
    });
    
    // Check for duplicate slugs (excluding null)
    const allProducts = await prisma.product.findMany({
      where: { slug: { not: null } },
      select: { id: true, name: true, slug: true }
    });
    
    const slugMap = new Map();
    const duplicates = [];
    
    allProducts.forEach(p => {
      if (slugMap.has(p.slug)) {
        duplicates.push({ slug: p.slug, products: [slugMap.get(p.slug), p] });
      } else {
        slugMap.set(p.slug, p);
      }
    });
    
    console.log(`\nDuplicate slugs found: ${duplicates.length}`);
    duplicates.forEach(d => {
      console.log(`  Slug: "${d.slug}"`);
      d.products.forEach(p => console.log(`    - ${p.name} (ID: ${p.id})`));
    });
    
    // Check if there are any products with the name "rrrrrrrrrrrr"
    const testProduct = await prisma.product.findFirst({
      where: { name: { contains: 'rrrrrrrrrrrr' } },
      select: { id: true, name: true, slug: true }
    });
    
    console.log(`\nTest product "rrrrrrrrrrrr" exists: ${testProduct ? 'YES' : 'NO'}`);
    if (testProduct) {
      console.log(`  - Name: ${testProduct.name}`);
      console.log(`  - Slug: ${testProduct.slug}`);
    }
    
  } catch (error) {
    console.error('Error checking slug issue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlugIssue();