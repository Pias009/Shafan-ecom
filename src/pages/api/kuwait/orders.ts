import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Kuwaiti store code. In a real app this might be derived from middleware/storage.
    const storeCode = 'KUW'
    // Find the Kuwait store
    const store: any = await (prisma as any).store?.findFirst?.({ where: { code: storeCode } })
    let orders: any[] = []
    if (store?.id) {
      orders = await (prisma as any).order?.findMany?.({ where: { storeId: store.id } }) ?? []
    }
    res.status(200).json({ store: store?.code ?? storeCode, orders })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch Kuwait orders' })
  }
}
