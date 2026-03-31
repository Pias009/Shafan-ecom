/**
 * Cleanup Script: Remove All Orphaned Data from KUW and GLOBAL stores
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up orphaned data...\n')

  const anyPrisma = prisma as any

  // Store IDs that were deleted
  const deletedStoreIds = [
    '69c8b063f6e207a1c37e7f04', // UAE store (from verification)
    '69c8b063f6e207a1c37e7f05', // Kuwait store (from removal)
  ]

  // ============================================
  // PHASE 1: Get all products with deleted store IDs
  // ============================================
  console.log('📍 PHASE 1: Identifying products with deleted store IDs')

  const productsToDelete: Array<{ id: string; name: string }> = []

  for (const storeId of deletedStoreIds) {
    const products = await anyPrisma.product?.findMany?.({
      where: { storeId },
      select: { id: true, name: true }
    })

    if (products && products.length > 0) {
      console.log(`   📦 Found ${products.length} products with storeId: ${storeId}`)
      productsToDelete.push(...products)
    }
  }

  if (productsToDelete.length === 0) {
    console.log('   ✅ No products to clean up')
    return
  }

  // ============================================
  // PHASE 2: Delete order items for these products
  // ============================================
  console.log('\n📍 PHASE 2: Deleting order items')

  for (const product of productsToDelete) {
    const orderItems = await anyPrisma.orderItem?.findMany?.({
      where: { productId: product.id }
    })

    if (orderItems && orderItems.length > 0) {
      console.log(`      - Deleting ${orderItems.length} order items for: ${product.name}`)
      await anyPrisma.orderItem?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 3: Delete store inventory for these products
  // ============================================
  console.log('\n📍 PHASE 3: Deleting store inventory')

  for (const product of productsToDelete) {
    const inventory = await anyPrisma.storeInventory?.findMany?.({
      where: { productId: product.id }
    })

    if (inventory && inventory.length > 0) {
      console.log(`      - Deleting ${inventory.length} inventory records for: ${product.name}`)
      await anyPrisma.storeInventory?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 4: Delete product categories for these products
  // ============================================
  console.log('\n📍 PHASE 4: Deleting product categories')

  for (const product of productsToDelete) {
    const categories = await anyPrisma.productCategory?.findMany?.({
      where: { productId: product.id }
    })

    if (categories && categories.length > 0) {
      console.log(`      - Deleting ${categories.length} category links for: ${product.name}`)
      await anyPrisma.productCategory?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 5: Delete product skin tones for these products
  // ============================================
  console.log('\n📍 PHASE 5: Deleting product skin tones')

  for (const product of productsToDelete) {
    const skinTones = await anyPrisma.productSkinTone?.findMany?.({
      where: { productId: product.id }
    })

    if (skinTones && skinTones.length > 0) {
      console.log(`      - Deleting ${skinTones.length} skin tone links for: ${product.name}`)
      await anyPrisma.productSkinTone?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 6: Delete product skin concerns for these products
  // ============================================
  console.log('\n📍 PHASE 6: Deleting product skin concerns')

  for (const product of productsToDelete) {
    const skinConcerns = await anyPrisma.productSkinConcern?.findMany?.({
      where: { productId: product.id }
    })

    if (skinConcerns && skinConcerns.length > 0) {
      console.log(`      - Deleting ${skinConcerns.length} skin concern links for: ${product.name}`)
      await anyPrisma.productSkinConcern?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 7: Delete product discounts for these products
  // ============================================
  console.log('\n📍 PHASE 7: Deleting product discounts')

  for (const product of productsToDelete) {
    const discounts = await anyPrisma.productDiscount?.findMany?.({
      where: { productId: product.id }
    })

    if (discounts && discounts.length > 0) {
      console.log(`      - Deleting ${discounts.length} discount links for: ${product.name}`)
      await anyPrisma.productDiscount?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 8: Delete country prices for these products
  // ============================================
  console.log('\n📍 PHASE 8: Deleting country prices')

  for (const product of productsToDelete) {
    const countryPrices = await anyPrisma.countryPrice?.findMany?.({
      where: { productId: product.id }
    })

    if (countryPrices && countryPrices.length > 0) {
      console.log(`      - Deleting ${countryPrices.length} country prices for: ${product.name}`)
      await anyPrisma.countryPrice?.deleteMany?.({
        where: { productId: product.id }
      })
    }
  }

  // ============================================
  // PHASE 9: Delete the products
  // ============================================
  console.log('\n📍 PHASE 9: Deleting products')

  for (const product of productsToDelete) {
    console.log(`      - Deleting product: ${product.name}`)
    await anyPrisma.product?.delete?.({
      where: { id: product.id }
    })
  }

  // ============================================
  // PHASE 10: Remove orders with deleted store IDs
  // ============================================
  console.log('\n📍 PHASE 10: Removing orders with deleted store IDs')

  for (const storeId of deletedStoreIds) {
    const orders = await anyPrisma.order?.findMany?.({
      where: { storeId }
    })

    if (orders && orders.length > 0) {
      console.log(`   📦 Found ${orders.length} orders with storeId: ${storeId}`)
      
      await anyPrisma.order?.deleteMany?.({
        where: { storeId }
      })
      console.log(`      ✅ Deleted ${orders.length} orders`)
    }
  }

  // ============================================
  // PHASE 11: Remove courier services with deleted store IDs
  // ============================================
  console.log('\n📍 PHASE 11: Removing courier services with deleted store IDs')

  for (const storeId of deletedStoreIds) {
    const couriers = await anyPrisma.courierService?.findMany?.({
      where: { storeId }
    })

    if (couriers && couriers.length > 0) {
      console.log(`   📦 Found ${couriers.length} courier services with storeId: ${storeId}`)
      
      await anyPrisma.courierService?.deleteMany?.({
        where: { storeId }
      })
      console.log(`      ✅ Deleted ${couriers.length} courier services`)
    }
  }

  // ============================================
  // PHASE 12: Remove country prices for Kuwait (if any)
  // ============================================
  console.log('\n📍 PHASE 12: Removing country prices for Kuwait')

  const kuwaitPrices = await anyPrisma.countryPrice?.findMany?.({
    where: { country: 'KW' }
  })

  if (kuwaitPrices && kuwaitPrices.length > 0) {
    console.log(`   📦 Found ${kuwaitPrices.length} Kuwait country prices`)
    
    await anyPrisma.countryPrice?.deleteMany?.({
      where: { country: 'KW' }
    })
    console.log(`      ✅ Deleted ${kuwaitPrices.length} Kuwait country prices`)
  }

  console.log('\n✅ Orphaned data cleanup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
