import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';
import { uploadFromUrl } from '@/lib/cloudinary';

const UpdateSchema = z.object({
  name: z.string().optional(),
  priceCents: z.number().optional(),
  discountCents: z.number().optional(),
  active: z.boolean().optional(),
  stockQuantity: z.number().optional(),
  brandName: z.string().optional(),
  categoryName: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  skinToneId: z.string().optional(),
  images: z.union([z.string(), z.array(z.string())]).optional(),
  mainImage: z.string().optional(),
  variants: z.any().optional(),
  kuwaitPrice: z.number().optional(),
  kuwaitStock: z.number().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const product = await prisma.product.findUnique({
    where: { id: id },
    select: {
      id: true,
      name: true,
      priceCents: true,
      discountCents: true,
      description: true,
      active: true,
      brand: { select: { name: true } },
      category: { select: { name: true, id: true } },
      subCategory: { select: { name: true, id: true } },
      skinTone: { select: { name: true, id: true } },
      categoryId: true,
      subCategoryId: true,
      skinToneId: true,
    },
  });
  if (!product) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(product), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    let data: any;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
    const parsed = UpdateSchema.safeParse(data);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // normalize features if provided as string
    if (typeof (parsed.data as any).features === 'string') {
      (parsed.data as any).features = ((parsed.data as any).features as string).split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    const updates: any = {};
    if (typeof parsed.data.name !== 'undefined') updates.name = parsed.data.name;
    if (typeof parsed.data.priceCents !== 'undefined') updates.priceCents = parsed.data.priceCents;
    if (typeof parsed.data.discountCents !== 'undefined') updates.discountCents = parsed.data.discountCents;
    if (typeof parsed.data.active !== 'undefined') updates.active = parsed.data.active;
    if (typeof (parsed.data as any).trending !== 'undefined') updates.trending = (parsed.data as any).trending;
    if (typeof parsed.data.stockQuantity !== 'undefined') updates.stockQuantity = parsed.data.stockQuantity;
    // Cloudinary: mainImage handling
    if (parsed.data.mainImage) {
      const url = await uploadFromUrl(parsed.data.mainImage).catch(() => parsed.data.mainImage);
      updates.mainImage = url;
    }
    // Images processing (may include Cloudinary uploads)
    if (parsed.data.images) {
      const urls = Array.isArray(parsed.data.images) ? parsed.data.images : [parsed.data.images];
      const uploaded = await Promise.all(urls.map((u: string) => uploadFromUrl(u).catch(() => u)));
      updates.images = uploaded;
    }
    if (parsed.data.variants !== undefined) {
      const v = parsed.data.variants;
      if (typeof v === 'string') {
        try { updates.variants = JSON.parse(v); } catch { updates.variants = v; }
      } else {
        updates.variants = v;
      }
    }
    if (parsed.data.brandName) {
      const b = await prisma.brand.findFirst({ where: { name: parsed.data.brandName } });
      if (b) updates.brandId = b.id;
    }
    if (parsed.data.categoryName) {
      const c = await prisma.category.findFirst({ where: { name: parsed.data.categoryName } });
      if (c) updates.categoryId = c.id;
    }
    // Handle direct ID assignments
    if (parsed.data.categoryId !== undefined) {
      updates.categoryId = parsed.data.categoryId || null;
    }
    if (parsed.data.subCategoryId !== undefined) {
      updates.subCategoryId = parsed.data.subCategoryId || null;
    }
    if (parsed.data.skinToneId !== undefined) {
      updates.skinToneId = parsed.data.skinToneId || null;
    }
    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const updated = await prisma.product.update({ where: { id: id }, data: updates });

    // Handle Kuwait inventory update
    const kuwaitPrice = (parsed.data as any).kuwaitPrice;
    const kuwaitStock = (parsed.data as any).kuwaitStock;

    if (kuwaitPrice !== undefined || kuwaitStock !== undefined) {
      const kuwStore = await prisma.store.findFirst({ where: { code: 'KUW' } });
      if (kuwStore) {
        await prisma.storeInventory.upsert({
          where: {
            storeId_productId: {
              storeId: kuwStore.id,
              productId: id
            }
          },
          update: {
            price: kuwaitPrice !== undefined ? kuwaitPrice : undefined,
            quantity: kuwaitStock !== undefined ? kuwaitStock : undefined,
          },
          create: {
            storeId: kuwStore.id,
            productId: id,
            price: kuwaitPrice || 0,
            quantity: kuwaitStock || 0,
          }
        });
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_PRODUCT',
          actorId: (session.user as any).id,
          subjectId: id,
          details: JSON.stringify(updates),
        },
      });
    } catch {
      // ignore audit log failures for now
    }
    return new Response(JSON.stringify(updated), { status: 303, headers: { 'Location': '/ueadmin/products' } });
  } catch (e) {
    console.error('PRODUCT_UPDATE_FATAL:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
