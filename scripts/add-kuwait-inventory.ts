import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding sample inventory for Kuwait store...')
  
  const anyPrisma = prisma as any
  
  // Get Kuwait store
  const kuwStore = await anyPrisma.store?.findFirst?.({ where: { code: 'KUW' } })
  
  if (!kuwStore) {
    console.error('❌ Kuwait store not found!')
    return
  }
  
  console.log(`Found Kuwait store: ${kuwStore.name} (${kuwStore.id})`)
  
  // Create sample products if they don't exist
  const sampleProducts = [
    {
      name: 'Kuwait Premium Dates',
      slug: 'kuwait-premium-dates',
      description: 'Premium quality dates from Kuwait',
      features: ['Organic', 'Premium', 'Local'],
      images: [],
      stockQuantity: 100,
      priceCents: 1500, // 15.00 KWD
      active: true,
      currency: 'KWD',
    },
    {
      name: 'Arabic Coffee Blend',
      slug: 'arabic-coffee-blend',
      description: 'Traditional Arabic coffee blend',
      features: ['Traditional', 'Premium'],
      images: [],
      stockQuantity: 50,
      priceCents: 2500, // 25.00 KWD
      active: true,
      currency: 'KWD',
    },
    {
      name: 'Kuwaiti Saffron',
      slug: 'kuwaiti-saffron',
      description: 'High quality saffron',
      features: ['Premium', 'Imported'],
      images: [],
      stockQuantity: 30,
      priceCents: 5000, // 50.00 KWD
      active: true,
      currency: 'KWD',
    },
  ]
  
  for (const productData of sampleProducts) {
    let product = await anyPrisma.product?.findFirst?.({ 
      where: { name: productData.name } 
    })
    
    if (!product) {
      product = await anyPrisma.product?.create?.({ data: productData })
      console.log(`✅ Created product: ${product.name}`)
    } else {
      console.log(`✅ Product already exists: ${product.name}`)
    }
    
    // Check if inventory exists for this product in Kuwait store
    let inventory = await anyPrisma.storeInventory?.findFirst?.({
      where: { 
        storeId: kuwStore.id, 
        productId: product.id 
      }
    })
    
    if (!inventory) {
      inventory = await anyPrisma.storeInventory?.create?.({
        data: {
          storeId: kuwStore.id,
          productId: product.id,
          quantity: productData.stockQuantity,
          price: productData.priceCents / 100, // Convert cents to decimal
        }
      })
      console.log(`  ✅ Added inventory: ${inventory.quantity} units @ ${inventory.price} KWD`)
    } else {
      console.log(`  ✅ Inventory already exists: ${inventory.quantity} units`)
    }
  }
  
  // Display current inventory
  const inventories = await anyPrisma.storeInventory?.findMany?.({
    where: { storeId: kuwStore.id },
    include: { product: true }
  })
  
  console.log('\n📋 Kuwait Store Inventory:')
  inventories?.forEach((inv: any) => {
    console.log(`  - ${inv.product?.name}: ${inv.quantity} units @ ${inv.price} KWD`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
