/**
 * Data Removal Script: Kuwait Admin Panel & Global Catalog
 * 
 * This script removes all data associated with:
 * 1. Kuwait Admin Panel (KUW store)
 * 2. Global Catalog (GLOBAL store)
 * 
 * WARNING: This is a destructive operation. Ensure you have backups before running.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting data removal process...\n')

  const anyPrisma = prisma as any

  // ============================================
  // PHASE 1: Remove Kuwait Admin Panel Data
  // ============================================
  console.log('📍 PHASE 1: Removing Kuwait Admin Panel Data (KUW store)')

  try {
    // Find Kuwait store
    const kuwaitStore = await anyPrisma.store?.findFirst?.({ 
      where: { code: 'KUW' } 
    })

    if (!kuwaitStore) {
      console.log('   ✅ Kuwait store (KUW) not found - already removed')
    } else {
      console.log(`   📦 Found Kuwait store: ${kuwaitStore.name} (ID: ${kuwaitStore.id})`)

      // Delete related data in proper order to avoid foreign key constraints
      console.log('   🗑️  Deleting Kuwait store data...')

      // Delete orders for Kuwait store
      const kuwaitOrders = await anyPrisma.order?.findMany?.({ 
        where: { storeId: kuwaitStore.id } 
      })
      if (kuwaitOrders?.length > 0) {
        console.log(`      - Deleting ${kuwaitOrders.length} orders...`)
        await anyPrisma.order?.deleteMany?.({ 
          where: { storeId: kuwaitStore.id } 
        })
      }

      // Delete courier services for Kuwait store
      const kuwaitCouriers = await anyPrisma.courierService?.findMany?.({ 
        where: { storeId: kuwaitStore.id } 
      })
      if (kuwaitCouriers?.length > 0) {
        console.log(`      - Deleting ${kuwaitCouriers.length} courier services...`)
        await anyPrisma.courierService?.deleteMany?.({ 
          where: { storeId: kuwaitStore.id } 
        })
      }

      // Delete store inventory for Kuwait store
      const kuwaitInventory = await anyPrisma.storeInventory?.findMany?.({ 
        where: { storeId: kuwaitStore.id } 
      })
      if (kuwaitInventory?.length > 0) {
        console.log(`      - Deleting ${kuwaitInventory.length} inventory records...`)
        await anyPrisma.storeInventory?.deleteMany?.({ 
          where: { storeId: kuwaitStore.id } 
        })
      }

      // Delete the Kuwait store itself
      await anyPrisma.store?.delete?.({ 
        where: { id: kuwaitStore.id } 
      })
      console.log('   ✅ Kuwait store (KUW) deleted successfully\n')
    }
  } catch (error) {
    console.error('   ❌ Error removing Kuwait data:', error)
  }

  // ============================================
  // PHASE 2: Remove Global Catalog Data
  // ============================================
  console.log('📍 PHASE 2: Removing Global Catalog Data (GLOBAL store)')

  try {
    // Find Global store
    const globalStore = await anyPrisma.store?.findFirst?.({ 
      where: { code: 'GLOBAL' } 
    })

    if (!globalStore) {
      console.log('   ✅ Global store (GLOBAL) not found - already removed')
    } else {
      console.log(`   📦 Found Global store: ${globalStore.name} (ID: ${globalStore.id})`)

      // Delete related data in proper order to avoid foreign key constraints
      console.log('   🗑️  Deleting Global store data...')

      // Delete orders for Global store
      const globalOrders = await anyPrisma.order?.findMany?.({ 
        where: { storeId: globalStore.id } 
      })
      if (globalOrders?.length > 0) {
        console.log(`      - Deleting ${globalOrders.length} orders...`)
        await anyPrisma.order?.deleteMany?.({ 
          where: { storeId: globalStore.id } 
        })
      }

      // Delete courier services for Global store
      const globalCouriers = await anyPrisma.courierService?.findMany?.({ 
        where: { storeId: globalStore.id } 
      })
      if (globalCouriers?.length > 0) {
        console.log(`      - Deleting ${globalCouriers.length} courier services...`)
        await anyPrisma.courierService?.deleteMany?.({ 
          where: { storeId: globalStore.id } 
        })
      }

      // Delete store inventory for Global store
      const globalInventory = await anyPrisma.storeInventory?.findMany?.({ 
        where: { storeId: globalStore.id } 
      })
      if (globalInventory?.length > 0) {
        console.log(`      - Deleting ${globalInventory.length} inventory records...`)
        await anyPrisma.storeInventory?.deleteMany?.({ 
          where: { storeId: globalStore.id } 
        })
      }

      // Delete the Global store itself
      await anyPrisma.store?.delete?.({ 
        where: { id: globalStore.id } 
      })
      console.log('   ✅ Global store (GLOBAL) deleted successfully\n')
    }
  } catch (error) {
    console.error('   ❌ Error removing Global data:', error)
  }

  // ============================================
  // PHASE 3: Clean up orphaned products
  // ============================================
  console.log('📍 PHASE 3: Cleaning up orphaned products')

  try {
    // Find products that were only associated with KUW or GLOBAL stores
    // These products have storeId set to either KUW or GLOBAL store IDs
    const allProducts = await anyPrisma.product?.findMany?.({
      where: {
        storeId: { not: null }
      }
    })

    if (allProducts && allProducts.length > 0) {
      console.log(`   📦 Found ${allProducts.length} products with store associations`)

      // Check if these products are orphaned (their stores no longer exist)
      for (const product of allProducts) {
        const storeExists = await anyPrisma.store?.findFirst?.({
          where: { id: product.storeId }
        })

        if (!storeExists) {
          console.log(`      - Deleting orphaned product: ${product.name}`)
          await anyPrisma.product?.delete?.({
            where: { id: product.id }
          })
        }
      }
      console.log('   ✅ Orphaned products cleaned up\n')
    } else {
      console.log('   ✅ No orphaned products found\n')
    }
  } catch (error) {
    console.error('   ❌ Error cleaning up orphaned products:', error)
  }

  // ============================================
  // PHASE 4: Verification
  // ============================================
  console.log('📍 PHASE 4: Verification')

  try {
    const kuwaitStore = await anyPrisma.store?.findFirst?.({ 
      where: { code: 'KUW' } 
    })
    const globalStore = await anyPrisma.store?.findFirst?.({ 
      where: { code: 'GLOBAL' } 
    })

    console.log('   📊 Final Status:')
    console.log(`      - Kuwait store (KUW): ${kuwaitStore ? '❌ STILL EXISTS' : '✅ REMOVED'}`)
    console.log(`      - Global store (GLOBAL): ${globalStore ? '❌ STILL EXISTS' : '✅ REMOVED'}`)
    console.log('\n✅ Data removal process completed!')
  } catch (error) {
    console.error('   ❌ Error during verification:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
