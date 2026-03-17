import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';
import { uploadFromUrl } from '@/lib/cloudinary';

const BulkUpdateSchema = z.object({
  ids: z.array(z.string()),
  updates: z.object({
    name: z.string().optional(),
    priceCents: z.number().optional(),
    discountCents: z.number().optional(),
    active: z.boolean().optional(),
    stockQuantity: z.number().optional(),
    images: z.union([z.string(), z.array(z.string())]).optional(),
    brandName: z.string().optional(),
    categoryName: z.string().optional(),
    variants: z.any().optional(),
  })
});

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
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
        if (updates.priceCents !== undefined) data.priceCents = updates.priceCents;
        if (updates.discountCents !== undefined) data.discountCents = updates.discountCents;
        if (updates.active !== undefined) data.active = updates.active;
        if (updates.stockQuantity !== undefined) data.stockQuantity = updates.stockQuantity;
        if (updates.images !== undefined) {
          const urls = Array.isArray(updates.images) ? updates.images : [updates.images];
          const uploaded = await Promise.all(urls.map((u: string) => uploadFromUrl(u).catch(() => u)));
          data.images = uploaded;
        }
        if (updates.brandName) {
          const b = await (prisma as any).brand.findFirst({ where: { name: updates.brandName } });
          if (b) data.brandId = b.id;
        }
        if (updates.categoryName) {
          const c = await (prisma as any).category.findFirst({ where: { name: updates.categoryName } });
          if (c) data.categoryId = c.id;
        }
        if (updates.variants !== undefined) data.variants = updates.variants;
        
        const updated = await (prisma as any).product.update({ where: { id }, data });
        
        // WooCommerce Sync
        try {
          const { wooApi } = await import('@/lib/woocommerce');
          const wooData: any = {};
          if (updated.name) wooData.name = updated.name;
          if (updated.priceCents) wooData.regular_price = (updated.priceCents / 100).toString();
          if (updated.discountCents !== undefined) wooData.sale_price = updated.discountCents ? (updated.discountCents / 100).toString() : '';
          if (updated.stockQuantity !== undefined) {
             wooData.manage_stock = true;
             wooData.stock_quantity = updated.stockQuantity;
          }
          if (updated.images) wooData.images = updated.images.map((src: string) => ({ src }));
          if (updated.active !== undefined) wooData.status = updated.active ? 'publish' : 'draft';

          if (updated.woocommerceId) {
            await wooApi.put(`products/${updated.woocommerceId}`, wooData).catch(() => {});
          }
        } catch (wooErr) {
           console.error(`Bulk Sync Error for ${id}:`, wooErr);
        }

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
