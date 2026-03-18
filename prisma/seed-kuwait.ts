import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create Kuwait store if not exists
  const anyPrisma = prisma as any
  let kuwStore = await anyPrisma.store?.findFirst?.({ where: { code: 'KUW' } })
  if (!kuwStore) {
    kuwStore = await anyPrisma.store?.create({
      data: {
        code: 'KUW',
        name: 'Kuwait Store',
        country: 'KW',
        region: 'MENA',
        active: true,
        currency: 'KWD',
      },
    })
  }

  // Ensure Global store exists for contrast
  let globalStore = await anyPrisma.store?.findFirst?.({ where: { code: 'GLOBAL' } })
  if (!globalStore) {
    globalStore = await anyPrisma.store?.create({
      data: {
        code: 'GLOBAL',
        name: 'Global Store',
        country: 'Global',
        region: 'Global',
        active: true,
        currency: 'USD',
      },
    })
  }

  // Seed sample products and per-store inventory for KUW and GLOBAL
  // Create or fetch sample products
  const pKUW = await (anyPrisma.product?.findFirst?.({ where: { name: 'Kuwait Exclusive Item' } }))
  const pGLOBAL = await (anyPrisma.product?.findFirst?.({ where: { name: 'Global Item' } }))
  const productKUW = pKUW ?? await (anyPrisma.product?.create?.({ data: {
    name: 'Kuwait Exclusive Item',
    description: 'Demo Kuwait item',
    features: ['demo'],
    images: [],
    stockQuantity: 0,
    priceCents: 999,
    active: true,
  }}))
  const productGLOBAL = pGLOBAL ?? await (anyPrisma.product?.create?.({ data: {
    name: 'Global Item',
    description: 'Global market item',
    features: ['global'],
    images: [],
    stockQuantity: 0,
    priceCents: 1999,
    active: true,
  }}))

  // Kuwait inventory
  const kuWaitInventory = await (anyPrisma.storeInventory?.findFirst?.({ where: { storeId: kuwStore.id, productId: productKUW?.id } }))
  if (!kuWaitInventory) {
    await (anyPrisma.storeInventory?.create?.({ data: {
      storeId: kuwStore.id,
      productId: productKUW?.id,
      quantity: 50,
      price: 9.99,
    }}))
  }

  // Global inventory
  const globalInv = await (anyPrisma.storeInventory?.findFirst?.({ where: { storeId: globalStore.id, productId: productGLOBAL?.id } }))
  if (!globalInv) {
    await (anyPrisma.storeInventory?.create?.({ data: {
      storeId: globalStore.id,
      productId: productGLOBAL?.id,
      quantity: 100,
      price: 19.99,
    }}))
  }

  // Note: Admin user seeding is environment-specific; ensure your auth system handles Kuwait admin users.
  console.log('Seeded Kuwait and Global stores with sample inventory (KUW-ITEM1 and GLOBAL-ITEM1).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
