import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { z } from 'zod';
import { uploadFromUrl } from '@/lib/cloudinary';

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, { message: "At least one ID is required" })
});

const BulkUpdateSchema = z.object({
  ids: z.array(z.string()),
  updates: z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    discountPrice: z.number().optional(),
    active: z.boolean().optional(),
    stockQuantity: z.number().optional(),
    images: z.union([z.string(), z.array(z.string())]).optional(),
    brandName: z.string().optional(),
    categoryName: z.string().optional(),
    variants: z.any().optional(),
  })
});

export async function POST(req: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = BulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const { ids, updates } = parsed.data;
    let updatedCount = 0;
    let failedCount = 0;
    
    for (const id of ids) {
      try {
        const data: any = { };
        if (updates.name !== undefined) data.name = updates.name;
        if (updates.price !== undefined) data.price = updates.price;
        if (updates.discountPrice !== undefined) data.discountPrice = updates.discountPrice;
        if (updates.active !== undefined) data.active = updates.active;
        if (updates.stockQuantity !== undefined) data.stockQuantity = updates.stockQuantity;
        if (updates.images !== undefined) {
          const urls = Array.isArray(updates.images) ? updates.images : [updates.images];
          const uploaded = await Promise.all(urls.map((u: string) => uploadFromUrl(u).catch(() => u)));
          data.images = uploaded;
        }
        if (updates.brandName) {
          const b = await prisma.brand.findFirst({ where: { name: updates.brandName } });
          if (b) data.brandId = b.id;
        }
        if (updates.categoryName) {
          const c = await prisma.category.findFirst({ where: { name: updates.categoryName } });
          if (c) data.categoryId = c.id;
        }
        if (updates.variants !== undefined) data.variants = updates.variants;
        
        await prisma.product.update({ where: { id }, data });
        
        updatedCount++;
      } catch (err) {
        console.error(`Bulk Update Failed for ${id}:`, err);
        failedCount++;
      }
    }
    return new Response(JSON.stringify({ updated: updatedCount, failed: failedCount }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const body = await req.json();
    const parsed = BulkDeleteSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid payload',
        details: parsed.error.issues 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const { ids } = parsed.data;
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const id of ids) {
      try {
        // Delete related records first (order matters — delete dependent relations before the product)
        await (prisma as any).orderItem.deleteMany({ where: { productId: id } });
        await (prisma as any).countryPrice.deleteMany({ where: { productId: id } });
        await (prisma as any).productCategory.deleteMany({ where: { productId: id } });
        await (prisma as any).productSkinTone.deleteMany({ where: { productId: id } });
        await (prisma as any).productSkinConcern.deleteMany({ where: { productId: id } });
        await (prisma as any).productDiscount.deleteMany({ where: { productId: id } });
        await (prisma as any).storeInventory.deleteMany({ where: { productId: id } });

        // Delete the product
        await (prisma as any).product.delete({ where: { id } });
        deletedCount++;
      } catch (err: any) {
        console.error(`Delete Failed for ${id}:`, err);
        failedCount++;
      }
    }
    
    return new Response(JSON.stringify({ 
      deleted: deletedCount, 
      failed: failedCount,
      message: `Deleted ${deletedCount} product(s)`
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Bulk delete error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
