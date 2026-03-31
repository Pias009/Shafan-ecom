/**
 * Verification Script: Confirm Kuwait Admin Panel & Global Catalog Removal
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying data removal...\n')

  const anyPrisma = prisma as any

  // Check for Kuwait store
  const kuwaitStore = await anyPrisma.store?.findFirst?.({ 
    where: { code: 'KUW' } 
  })

  // Check for Global store
  const globalStore = await anyPrisma.store?.findFirst?.({ 
    where: { code: 'GLOBAL' } 
  })

  // Check for products with store associations
  const productsWithStore = await anyPrisma.product?.findMany?.({
    where: {
      storeId: { not: null }
    },
    select: {
      id: true,
      name: true,
      storeId: true
    }
  })

  // Check for orders with KUW or GLOBAL store references
  const kuwaitOrders = await anyPrisma.order?.findMany?.({
    where: { storeId: kuwaitStore?.id }
  })

  const globalOrders = await anyPrisma.order?.findMany?.({
    where: { storeId: globalStore?.id }
  })

  // Check for courier services
  const kuwaitCouriers = await anyPrisma.courierService?.findMany?.({
    where: { storeId: kuwaitStore?.id }
  })

  const globalCouriers = await anyPrisma.courierService?.findMany?.({
    where: { storeId: globalStore?.id }
  })

  // Check for store inventory
  const kuwaitInventory = await anyPrisma.storeInventory?.findMany?.({
    where: { storeId: kuwaitStore?.id }
  })

  const globalInventory = await anyPrisma.storeInventory?.findMany?.({
    where: { storeId: globalStore?.id }
  })

  console.log('📊 Verification Results:\n')
  console.log('Stores:')
  console.log(`  - Kuwait Store (KUW): ${kuwaitStore ? '❌ EXISTS' : '✅ REMOVED'}`)
  console.log(`  - Global Store (GLOBAL): ${globalStore ? '❌ EXISTS' : '✅ REMOVED'}\n`)

  console.log('Orders:')
  console.log(`  - Kuwait Orders: ${kuwaitOrders?.length || 0} found`)
  console.log(`  - Global Orders: ${globalOrders?.length || 0} found\n`)

  console.log('Courier Services:')
  console.log(`  - Kuwait Couriers: ${kuwaitCouriers?.length || 0} found`)
  console.log(`  - Global Couriers: ${globalCouriers?.length || 0} found\n`)

  console.log('Store Inventory:')
  console.log(`  - Kuwait Inventory: ${kuwaitInventory?.length || 0} found`)
  console.log(`  - Global Inventory: ${globalInventory?.length || 0} found\n`)

  console.log('Products with Store Associations:')
  if (productsWithStore && productsWithStore.length > 0) {
    console.log(`  - ${productsWithStore.length} products still have storeId set:`)
    productsWithStore.forEach((p: { name: string; storeId: string | null }) => {
      console.log(`    • ${p.name} (storeId: ${p.storeId})`)
    })
  } else {
    console.log('  - ✅ No products with store associations found')
  }

  console.log('\n✅ Verification complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error during verification:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
