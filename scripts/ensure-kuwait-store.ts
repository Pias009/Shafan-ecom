import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for Kuwait store...')
  
  const anyPrisma = prisma as any
  
  // Check if Kuwait store exists
  let kuwStore = await anyPrisma.store?.findFirst?.({ where: { code: 'KUW' } })
  
  if (!kuwStore) {
    console.log('Kuwait store not found. Creating...')
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
    console.log('✅ Kuwait store created successfully!')
  } else {
    console.log('✅ Kuwait store already exists.')
  }
  
  // Also ensure UAE store exists as fallback
  let uaeStore = await anyPrisma.store?.findFirst?.({ where: { code: 'UAE' } })
  
  if (!uaeStore) {
    console.log('UAE store not found. Creating...')
    uaeStore = await anyPrisma.store?.create({
      data: {
        code: 'UAE',
        name: 'UAE Store',
        country: 'AE',
        region: 'MENA',
        active: true,
        currency: 'AED',
      },
    })
    console.log('✅ UAE store created successfully!')
  } else {
    console.log('✅ UAE store already exists.')
  }
  
  // List all stores
  const allStores = await anyPrisma.store?.findMany?.()
  console.log('\n📋 All stores in database:')
  allStores?.forEach((store: any) => {
    console.log(`  - ${store.code}: ${store.name} (${store.country})`)
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
