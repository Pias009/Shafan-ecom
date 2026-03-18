import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeCode } = req.query
  if (typeof storeCode !== 'string') {
    res.status(400).json({ error: 'Invalid store code' })
    return
  }
  try {
    const storeWithInventory: any = await (prisma as any).store.findFirst({
      where: { code: storeCode },
      include: { storeInventories: { include: { product: true } } },
    })

    if (!storeWithInventory) {
      res.status(404).json({ error: 'Store not found' })
      return
    }

    const inventory = (storeWithInventory.storeInventories ?? []).map((si: any) => ({
      product: {
        id: si.product?.id,
        name: si.product?.name,
        sku: si.product?.sku,
      },
      quantity: si.quantity,
      price: si.price,
    }))

    res.status(200).json({ store: storeCode, inventory })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
}
